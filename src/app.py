from __future__ import annotations

import os
from datetime import datetime
from functools import wraps
from io import BytesIO
from pathlib import Path
from urllib.parse import quote_plus, urlparse

from dotenv import load_dotenv
from flask import Flask, abort, current_app, redirect, render_template, request, send_file, send_from_directory, session, url_for
from sqlalchemy import text
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from src.models import ReportPhoto, ReportPulizia, ReportSend, User, db
from src.services.activity_plans import load_activity_plans
from src.services.report_template import load_report_template_fields, report_to_template_rows
from src.services.reports import generate_report_pdf, generate_reports_csv, validate_report_payload
from src.services.v1_spec import (
    IMMOBILE_TYPES,
    PHOTO_CATEGORIES,
    REPORT_STATUSES,
    build_quick_templates,
    load_anomalies,
    load_checklist_sections,
)


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
ALLOWED_PHOTO_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _resolve_db_path(path_value: str) -> Path:
    path = Path(path_value)
    if not path.is_absolute():
        path = BASE_DIR / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _migrate_sqlite_columns() -> None:
    columns = {row[1] for row in db.session.execute(text("PRAGMA table_info(report_pulizie)")).fetchall()}
    additions = {
        "cliente": "ALTER TABLE report_pulizie ADD COLUMN cliente VARCHAR(160)",
        "indirizzo": "ALTER TABLE report_pulizie ADD COLUMN indirizzo VARCHAR(240)",
        "tipologia_immobile": "ALTER TABLE report_pulizie ADD COLUMN tipologia_immobile VARCHAR(80)",
        "orario_entrata": "ALTER TABLE report_pulizie ADD COLUMN orario_entrata VARCHAR(5)",
        "orario_uscita": "ALTER TABLE report_pulizie ADD COLUMN orario_uscita VARCHAR(5)",
        "pausa_minuti": "ALTER TABLE report_pulizie ADD COLUMN pausa_minuti INTEGER DEFAULT 0 NOT NULL",
        "totale_ore": "ALTER TABLE report_pulizie ADD COLUMN totale_ore FLOAT DEFAULT 0 NOT NULL",
        "anomalie": "ALTER TABLE report_pulizie ADD COLUMN anomalie TEXT",
        "note_anomalia": "ALTER TABLE report_pulizie ADD COLUMN note_anomalia TEXT",
        "external_video_link": "ALTER TABLE report_pulizie ADD COLUMN external_video_link VARCHAR(500)",
        "external_video_description": "ALTER TABLE report_pulizie ADD COLUMN external_video_description TEXT",
        "stato": "ALTER TABLE report_pulizie ADD COLUMN stato VARCHAR(30) DEFAULT 'Bozza' NOT NULL",
    }
    for column, statement in additions.items():
        if column not in columns:
            db.session.execute(text(statement))
    db.session.execute(text("UPDATE report_pulizie SET cliente = sede WHERE cliente IS NULL OR cliente = ''"))
    db.session.commit()


def _seed_default_users() -> None:
    defaults = [
        {
            "username": os.getenv("ADMIN_USERNAME", "admin"),
            "password": os.getenv("ADMIN_PASSWORD", "admin123"),
            "display_name": os.getenv("ADMIN_DISPLAY_NAME", "Responsabile"),
            "role": "admin",
        },
        {
            "username": os.getenv("OPERATOR_USERNAME", "operatore"),
            "password": os.getenv("OPERATOR_PASSWORD", "operatore123"),
            "display_name": os.getenv("OPERATOR_DISPLAY_NAME", "Operatore Demo"),
            "role": "operatore",
        },
    ]
    for item in defaults:
        existing = User.query.filter_by(username=item["username"]).first()
        if existing:
            continue
        db.session.add(
            User(
                username=item["username"],
                password_hash=generate_password_hash(item["password"], method="pbkdf2:sha256"),
                display_name=item["display_name"],
                role=item["role"],
            )
        )
    db.session.commit()


def _current_user() -> User | None:
    user_id = session.get("user_id")
    if not user_id:
        return None
    return db.session.get(User, user_id)


def _user_can_access_report(user: User, report: ReportPulizia) -> bool:
    return user.is_admin or report.operatore == user.display_name


def _report_or_404(report_id: int) -> ReportPulizia:
    report = db.session.get(ReportPulizia, report_id)
    user = _current_user()
    if report is None or user is None or not _user_can_access_report(user, report):
        abort(404)
    return report


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if _current_user() is None:
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)

    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = _current_user()
        if user is None:
            return redirect(url_for("login", next=request.path))
        if not user.is_admin:
            abort(403)
        return view(*args, **kwargs)

    return wrapped


def _form_context(form=None, errors=None):
    checklist_sections = load_checklist_sections(BASE_DIR)
    return {
        "activity_plans": load_activity_plans(BASE_DIR),
        "anomalies": load_anomalies(BASE_DIR),
        "checklist_sections": checklist_sections,
        "quick_templates": build_quick_templates(checklist_sections),
        "immobile_types": IMMOBILE_TYPES,
        "photo_categories": PHOTO_CATEGORIES,
        "errors": errors or {},
        "form": form or {},
    }


def _safe_next_url(next_url: str | None) -> str:
    if not next_url:
        return url_for("index")
    parsed = urlparse(next_url)
    if parsed.netloc or parsed.scheme:
        return url_for("index")
    return next_url if next_url.startswith("/") else url_for("index")


def _save_report_photos(report: ReportPulizia) -> None:
    upload_root = BASE_DIR / "data" / "uploads" / "reports" / str(report.id)
    uploaded_files = request.files.getlist("photos")
    categories = request.form.getlist("photo_categories")
    notes = request.form.getlist("photo_notes")

    for index, uploaded_file in enumerate(uploaded_files[:10]):
        if not uploaded_file or not uploaded_file.filename:
            continue
        original_name = secure_filename(uploaded_file.filename)
        extension = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
        if extension not in ALLOWED_PHOTO_EXTENSIONS:
            current_app.logger.warning("Foto ignorata per estensione non valida: %s", original_name)
            continue

        upload_root.mkdir(parents=True, exist_ok=True)
        filename = f"{index + 1}_{original_name}"
        uploaded_file.save(upload_root / filename)
        db.session.add(
            ReportPhoto(
                report_id=report.id,
                filename=f"reports/{report.id}/{filename}",
                original_filename=original_name,
                categoria=categories[index] if index < len(categories) and categories[index] else "Altro",
                note=notes[index] if index < len(notes) else "",
            )
        )


def _share_message(report: ReportPulizia) -> str:
    lines = [
        "Ciao, ti invio il report della pulizia effettuata oggi.",
        "",
        f"Operatore: {report.operatore}",
        f"Cliente: {report.cliente or report.sede}",
        f"Data: {report.data.strftime('%Y-%m-%d')}",
        f"Orario: {report.orario_entrata or '-'} - {report.orario_uscita or '-'}",
        f"Totale ore: {report.totale_ore:.2f}",
    ]
    if report.external_video_link:
        lines.extend(["", "Link video:", report.external_video_link])
    lines.extend(["", "PDF report allegato."])
    return "\n".join(lines)


def _build_report_pdf(report: ReportPulizia) -> tuple[bytes, str]:
    template_fields = load_report_template_fields(BASE_DIR)
    template_rows = report_to_template_rows(report, template_fields)
    template_rows.append(("Foto allegate", f"{len(report.photos)} foto" if report.photos else "Nessuna foto allegata al report."))
    template_rows.append(("Creato il", report.created_at.strftime("%Y-%m-%d %H:%M")))
    template_rows.append(("Generato il", datetime.now().strftime("%Y-%m-%d %H:%M")))
    pdf_bytes = generate_report_pdf(
        {
            "id": report.id,
            "data": report.data.strftime("%Y-%m-%d"),
            "sede": report.sede,
            "operatore": report.operatore,
            "attivita_svolte": report.attivita_svolte,
            "note": report.note,
            "firma": report.firma,
            "created_at": report.created_at.strftime("%Y-%m-%d %H:%M"),
        },
        rows=template_rows,
    )

    safe_cliente = secure_filename(report.cliente or report.sede or "cliente")
    safe_operatore = secure_filename(report.operatore or "operatore")
    filename = f"report-pulizia-{safe_cliente}-{report.data.strftime('%Y-%m-%d')}-{safe_operatore}.pdf"
    return pdf_bytes, filename


def _diagnostic_item(name: str, status: str, detail: str) -> dict[str, str]:
    return {"name": name, "status": status, "detail": detail}


def _run_diagnostics(app: Flask) -> list[dict[str, str]]:
    checks: list[dict[str, str]] = []

    try:
        db.session.execute(text("SELECT 1"))
        checks.append(_diagnostic_item("Database SQLite", "ok", "Connessione attiva"))
    except Exception as exc:
        checks.append(_diagnostic_item("Database SQLite", "error", str(exc)))

    user_count = User.query.count()
    checks.append(
        _diagnostic_item(
            "Utenti",
            "ok" if user_count >= 2 else "warn",
            f"{user_count} utenti configurati",
        )
    )

    template_path = BASE_DIR / "templates" / "report_template.md"
    template_fields = load_report_template_fields(BASE_DIR)
    expected_template_keys = {"data", "cliente", "operatore", "attivita_svolte", "totale_ore"}
    template_keys = {field.key for field in template_fields}
    if not template_path.exists():
        checks.append(_diagnostic_item("Template report Markdown", "error", "File templates/report_template.md mancante"))
    elif not expected_template_keys.issubset(template_keys):
        missing = ", ".join(sorted(expected_template_keys - template_keys))
        checks.append(_diagnostic_item("Template report Markdown", "warn", f"Campi chiave mancanti: {missing}"))
    else:
        checks.append(_diagnostic_item("Template report Markdown", "ok", f"{len(template_fields)} campi caricati"))

    try:
        plans = load_activity_plans(BASE_DIR)
        checks.append(
            _diagnostic_item(
                "Piani attività Markdown",
                "ok" if plans else "warn",
                f"{len(plans)} piani caricati",
            )
        )
    except Exception as exc:
        checks.append(_diagnostic_item("Piani attività Markdown", "error", str(exc)))

    try:
        sections = load_checklist_sections(BASE_DIR)
        item_count = sum(len(section.items) for section in sections)
        checks.append(
            _diagnostic_item(
                "Checklist V1",
                "ok" if sections and item_count else "error",
                f"{len(sections)} sezioni, {item_count} attività",
            )
        )
    except Exception as exc:
        checks.append(_diagnostic_item("Checklist V1", "error", str(exc)))

    try:
        anomalies = load_anomalies(BASE_DIR)
        has_none = "Nessuna anomalia" in anomalies
        checks.append(
            _diagnostic_item(
                "Anomalie V1",
                "ok" if anomalies and has_none else "warn",
                f"{len(anomalies)} anomalie; Nessuna anomalia={'presente' if has_none else 'mancante'}",
            )
        )
    except Exception as exc:
        checks.append(_diagnostic_item("Anomalie V1", "error", str(exc)))

    upload_dir = Path(app.config["UPLOAD_FOLDER"])
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
        probe = upload_dir / ".diagnostic-write-test"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
        checks.append(_diagnostic_item("Archivio upload foto", "ok", str(upload_dir)))
    except Exception as exc:
        checks.append(_diagnostic_item("Archivio upload foto", "error", str(exc)))

    latest_report = ReportPulizia.query.order_by(ReportPulizia.id.desc()).first()
    if latest_report is None:
        checks.append(_diagnostic_item("Generazione PDF", "warn", "Nessun report disponibile per test PDF"))
    else:
        try:
            pdf_bytes, filename = _build_report_pdf(latest_report)
            checks.append(_diagnostic_item("Generazione PDF", "ok", f"{filename} ({len(pdf_bytes)} byte)"))
        except Exception as exc:
            checks.append(_diagnostic_item("Generazione PDF", "error", str(exc)))

    required_endpoints = {
        "login",
        "index",
        "new_report",
        "admin_dashboard",
        "photo_archive",
        "report_pdf_export",
        "report_pdf_download",
        "reports_csv",
        "healthz",
    }
    endpoints = {rule.endpoint for rule in app.url_map.iter_rules()}
    missing_endpoints = required_endpoints - endpoints
    checks.append(
        _diagnostic_item(
            "Interconnessioni route",
            "ok" if not missing_endpoints else "error",
            "Tutte le route critiche presenti" if not missing_endpoints else f"Mancano: {', '.join(sorted(missing_endpoints))}",
        )
    )

    secret_key = app.config.get("SECRET_KEY")
    if secret_key in {"dev-secret-key", "change-me"}:
        checks.append(_diagnostic_item("SECRET_KEY", "warn", "Usare una SECRET_KEY personalizzata prima della consegna"))
    else:
        checks.append(_diagnostic_item("SECRET_KEY", "ok", "Configurata"))

    if os.getenv("FLASK_DEBUG", "0") == "1":
        checks.append(_diagnostic_item("Modalità debug", "warn", "FLASK_DEBUG=1: usare gunicorn/FLASK_DEBUG=0 in consegna"))
    else:
        checks.append(_diagnostic_item("Modalità debug", "ok", "Debug disattivato"))

    return checks


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__, template_folder=str(BASE_DIR / "templates"), static_folder=str(BASE_DIR / "static"))

    db_path_value = os.getenv("DATABASE_PATH", "data/report_pulizie.db")
    db_path = _resolve_db_path(db_path_value)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["UPLOAD_FOLDER"] = str(BASE_DIR / "data" / "uploads")
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    if test_config:
        app.config.update(test_config)

    db.init_app(app)

    with app.app_context():
        db.create_all()
        _migrate_sqlite_columns()
        _seed_default_users()

    @app.context_processor
    def inject_auth_context():
        return {"current_user": _current_user()}

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response

    @app.get("/healthz")
    def healthz():
        db.session.execute(text("SELECT 1"))
        return {"status": "ok", "app": "Daily Cleaning Report V1"}

    @app.get("/login")
    def login():
        if _current_user() is not None:
            return redirect(url_for("index"))
        return render_template("login.html", error=None, next_url=request.args.get("next", ""))

    @app.post("/login")
    def login_post():
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""
        next_url = _safe_next_url(request.form.get("next"))
        user = User.query.filter_by(username=username, active=True).first()
        if user is None or not check_password_hash(user.password_hash, password):
            return render_template("login.html", error="Credenziali non valide", next_url=next_url), 401
        session["user_id"] = user.id
        return redirect(next_url)

    @app.post("/logout")
    def logout():
        session.clear()
        return redirect(url_for("login"))

    @app.get("/")
    @login_required
    def index():
        user = _current_user()
        q = (request.args.get("q") or "").strip()
        query = ReportPulizia.query
        if user and not user.is_admin:
            query = query.filter(ReportPulizia.operatore == user.display_name)
        if q:
            like_q = f"%{q}%"
            query = query.filter(
                (ReportPulizia.sede.ilike(like_q))
                | (ReportPulizia.cliente.ilike(like_q))
                | (ReportPulizia.operatore.ilike(like_q))
            )
        reports = query.order_by(ReportPulizia.data.desc(), ReportPulizia.created_at.desc()).all()
        return render_template("index.html", reports=reports, q=q)

    @app.get("/admin")
    @admin_required
    def admin_dashboard():
        query = ReportPulizia.query
        filters = {
            "data": (request.args.get("data") or "").strip(),
            "operatore": (request.args.get("operatore") or "").strip(),
            "cliente": (request.args.get("cliente") or "").strip(),
            "stato": (request.args.get("stato") or "").strip(),
            "anomalie": (request.args.get("anomalie") or "").strip(),
        }
        if filters["data"]:
            query = query.filter(ReportPulizia.data == filters["data"])
        if filters["operatore"]:
            query = query.filter(ReportPulizia.operatore.ilike(f"%{filters['operatore']}%"))
        if filters["cliente"]:
            query = query.filter((ReportPulizia.cliente.ilike(f"%{filters['cliente']}%")) | (ReportPulizia.sede.ilike(f"%{filters['cliente']}%")))
        if filters["stato"]:
            query = query.filter(ReportPulizia.stato == filters["stato"])
        if filters["anomalie"] == "si":
            query = query.filter(ReportPulizia.anomalie.isnot(None), ~ReportPulizia.anomalie.contains("Nessuna anomalia"))
        reports = query.order_by(ReportPulizia.created_at.desc()).all()
        total_hours = sum(report.totale_ore or 0 for report in reports)
        anomaly_count = sum(1 for report in reports if report.anomalie and "Nessuna anomalia" not in report.anomalie)
        sends = ReportSend.query.order_by(ReportSend.created_at.desc()).limit(20).all()
        users = User.query.order_by(User.role, User.display_name).all()
        return render_template(
            "admin_dashboard.html",
            reports=reports,
            total_hours=total_hours,
            anomaly_count=anomaly_count,
            statuses=REPORT_STATUSES,
            filters=filters,
            sends=sends,
            users=users,
        )

    @app.get("/admin/diagnostics")
    @admin_required
    def admin_diagnostics():
        checks = _run_diagnostics(app)
        status_order = {"error": 0, "warn": 1, "ok": 2}
        overall = min((check["status"] for check in checks), key=lambda status: status_order[status], default="ok")
        return render_template("admin_diagnostics.html", checks=checks, overall=overall)

    @app.post("/admin/reports/<int:report_id>/status")
    @admin_required
    def admin_update_report_status(report_id: int):
        report = db.session.get(ReportPulizia, report_id)
        if report is None:
            abort(404)
        new_status = request.form.get("stato") or ""
        if new_status not in REPORT_STATUSES:
            abort(400)
        report.stato = new_status
        db.session.commit()
        return redirect(url_for("admin_dashboard"))

    @app.post("/admin/users")
    @admin_required
    def admin_create_user():
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""
        display_name = (request.form.get("display_name") or "").strip()
        role = request.form.get("role") or "operatore"
        if not username or not password or not display_name or role not in {"admin", "operatore"}:
            abort(400)
        if User.query.filter_by(username=username).first() is not None:
            abort(400)
        db.session.add(
            User(
                username=username,
                password_hash=generate_password_hash(password, method="pbkdf2:sha256"),
                display_name=display_name,
                role=role,
            )
        )
        db.session.commit()
        return redirect(url_for("admin_dashboard"))

    @app.post("/admin/users/<int:user_id>/toggle")
    @admin_required
    def admin_toggle_user(user_id: int):
        user = db.session.get(User, user_id)
        if user is None:
            abort(404)
        if user.id == session.get("user_id"):
            abort(400)
        user.active = not user.active
        db.session.commit()
        return redirect(url_for("admin_dashboard"))

    @app.get("/admin/photos")
    @admin_required
    def photo_archive():
        photos = ReportPhoto.query.order_by(ReportPhoto.created_at.desc()).all()
        return render_template("photo_archive.html", photos=photos)

    @app.get("/uploads/<path:filename>")
    @login_required
    def uploaded_file(filename: str):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.get("/reports/export.csv")
    @login_required
    def reports_csv():
        user = _current_user()
        query = ReportPulizia.query
        if user and not user.is_admin:
            query = query.filter(ReportPulizia.operatore == user.display_name)
        reports = query.order_by(ReportPulizia.data.desc(), ReportPulizia.created_at.desc()).all()
        return send_file(
            path_or_file=BytesIO(generate_reports_csv(reports)),
            as_attachment=True,
            download_name="report_pulizie.csv",
            mimetype="text/csv",
        )

    @app.get("/reports/new")
    @login_required
    def new_report():
        return render_template("new_report.html", **_form_context())

    @app.post("/reports")
    @login_required
    def create_report():
        user = _current_user()
        form = request.form.copy()
        if user and not user.is_admin:
            form["operatore"] = user.display_name
        errors, cleaned = validate_report_payload(form)
        if errors:
            return render_template("new_report.html", **_form_context(form=form, errors=errors)), 400

        if user and not user.is_admin:
            cleaned["operatore"] = user.display_name
        report = ReportPulizia(**cleaned)
        db.session.add(report)
        db.session.commit()
        _save_report_photos(report)
        db.session.commit()

        return redirect(url_for("report_detail", report_id=report.id))

    @app.get("/reports/<int:report_id>")
    @login_required
    def report_detail(report_id: int):
        report = _report_or_404(report_id)
        template_fields = load_report_template_fields(BASE_DIR)
        return render_template(
            "report_detail.html",
            report=report,
            template_rows=report_to_template_rows(report, template_fields),
            template_source="templates/report_template.md",
            share_message=_share_message(report),
            pdf_export_url=url_for("report_pdf_export", report_id=report.id),
            whatsapp_url=f"https://wa.me/?text={quote_plus(_share_message(report))}",
            telegram_url=f"https://t.me/share/url?text={quote_plus(_share_message(report))}",
            email_url=f"mailto:?subject={quote_plus('Report pulizia - ' + (report.cliente or report.sede) + ' - ' + report.data.strftime('%Y-%m-%d'))}&body={quote_plus(_share_message(report))}",
        )

    @app.get("/reports/<int:report_id>/pdf/export")
    @login_required
    def report_pdf_export(report_id: int):
        report = _report_or_404(report_id)
        _, filename = _build_report_pdf(report)
        return render_template(
            "pdf_export.html",
            report=report,
            filename=filename,
            pdf_url=url_for("report_pdf", report_id=report.id),
            forced_pdf_url=url_for("report_pdf_download", report_id=report.id),
        )

    @app.post("/reports/<int:report_id>/send/<canale>")
    @login_required
    def log_send(report_id: int, canale: str):
        report = _report_or_404(report_id)
        report.stato = "Inviato"
        db.session.add(ReportSend(report_id=report.id, canale=canale, messaggio=_share_message(report)))
        db.session.commit()
        return redirect(url_for("report_detail", report_id=report.id))

    @app.get("/reports/<int:report_id>/pdf")
    @login_required
    def report_pdf(report_id: int):
        report = _report_or_404(report_id)

        pdf_bytes, filename = _build_report_pdf(report)
        return send_file(
            path_or_file=BytesIO(pdf_bytes),
            as_attachment=True,
            download_name=filename,
            mimetype="application/pdf",
        )

    @app.get("/reports/<int:report_id>/pdf/download")
    @login_required
    def report_pdf_download(report_id: int):
        report = _report_or_404(report_id)
        pdf_bytes, filename = _build_report_pdf(report)
        return send_file(
            path_or_file=BytesIO(pdf_bytes),
            as_attachment=True,
            download_name=filename,
            mimetype="application/octet-stream",
            max_age=0,
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("APP_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
