from __future__ import annotations

from pathlib import Path

import pytest

from src.app import create_app
from src.models import ActivityPackage, OperationalProcedure, ReportPulizia, db
from src.services.activity_plans import load_activity_plans
from src.services.report_template import load_report_template_fields


@pytest.fixture()
def app(tmp_path: Path):
    db_path = tmp_path / "test.db"
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "WTF_CSRF_ENABLED": False,
        }
    )
    with app.app_context():
        db.create_all()
    yield app


@pytest.fixture()
def client(app):
    client = app.test_client()
    client.post("/login", data={"username": "admin", "password": "admin123"})
    return client


def login_as(client, username: str, password: str):
    client.post("/logout")
    return client.post("/login", data={"username": username, "password": password}, follow_redirects=False)


def test_login_required(client):
    client.post("/logout")
    response = client.get("/reports/new")
    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_login_success(client):
    client.post("/logout")
    response = client.post("/login", data={"username": "admin", "password": "admin123"}, follow_redirects=False)
    assert response.status_code == 302


def test_create_report_success(client):
    response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Milano Centro",
            "operatore": "Luca",
            "attivita_svolte": "Pulizia completa uffici",
            "note": "Tutto ok",
            "firma": "Luca",
        },
        follow_redirects=False,
    )
    assert response.status_code == 302
    assert "/reports/" in response.headers["Location"]


def test_create_report_validation_error(client):
    response = client.post("/reports", data={"sede": "Roma"})
    assert response.status_code == 400
    assert b"Campo obbligatorio" in response.data


def test_index_lists_reports(client):
    client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Torino",
            "operatore": "Anna",
            "attivita_svolte": "Pulizia sale",
        },
    )
    response = client.get("/")
    assert response.status_code == 200
    assert b"Torino" in response.data


def test_reports_alias_lists_reports(client):
    response = client.get("/reports")
    assert response.status_code == 200
    assert b"Report" in response.data


def test_report_not_found(client):
    response = client.get("/reports/999")
    assert response.status_code == 404


def test_pdf_export(client):
    create_response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Bologna",
            "operatore": "Marco",
            "attivita_svolte": "Pulizia bagni",
        },
        follow_redirects=False,
    )
    report_url = create_response.headers["Location"]
    report_id = report_url.rsplit("/", 1)[-1]

    response = client.get(f"/reports/{report_id}/pdf")
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/pdf"
    assert response.data.startswith(b"%PDF")


def test_report_detail_has_quick_pdf_download(client):
    create_response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Bologna",
            "operatore": "Marco",
            "attivita_svolte": "Pulizia bagni",
        },
        follow_redirects=False,
    )
    report_url = create_response.headers["Location"]

    response = client.get(report_url)

    assert response.status_code == 200
    assert b"Scarica PDF" in response.data
    assert f'{report_url}/pdf/export'.encode() in response.data


def test_pdf_export_page_starts_download_flow(client):
    create_response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Bologna",
            "operatore": "Marco",
            "attivita_svolte": "Pulizia bagni",
        },
        follow_redirects=False,
    )
    report_url = create_response.headers["Location"]

    response = client.get(f"{report_url}/pdf/export")

    assert response.status_code == 200
    assert b"Scarica il PDF" in response.data
    assert f"{report_url}/pdf/download".encode() in response.data
    assert f"{report_url}/pdf/view".encode() in response.data


def test_forced_pdf_download_uses_binary_attachment(client):
    create_response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Bologna",
            "operatore": "Marco",
            "attivita_svolte": "Pulizia bagni",
        },
        follow_redirects=False,
    )
    report_url = create_response.headers["Location"]

    response = client.get(f"{report_url}/pdf/download")

    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/octet-stream"
    assert "attachment" in response.headers["Content-Disposition"]
    assert response.data.startswith(b"%PDF")


def test_pdf_view_opens_inline(client):
    create_response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Bologna",
            "operatore": "Marco",
            "attivita_svolte": "Pulizia bagni",
        },
        follow_redirects=False,
    )
    report_url = create_response.headers["Location"]

    response = client.get(f"{report_url}/pdf/view")

    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/pdf"
    assert "inline" in response.headers["Content-Disposition"]
    assert response.data.startswith(b"%PDF")


def test_csv_export(client):
    client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "sede": "Genova",
            "operatore": "Sara",
            "attivita_svolte": "Pulizia reception",
        },
    )

    response = client.get("/reports/export.csv")

    assert response.status_code == 200
    assert response.headers["Content-Type"].startswith("text/csv")
    assert "Genova" in response.data.decode("utf-8-sig")


def test_complete_report_requires_times(client):
    response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "cliente": "Casa Rossi",
            "operatore": "Sara",
            "attivita_svolte": "Pulizia generale",
            "submit_action": "Completato",
        },
    )
    assert response.status_code == 400
    assert b"Orario entrata obbligatorio" in response.data


def test_complete_report_calculates_total_hours(client, app):
    response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "cliente": "Casa Verdi",
            "operatore": "Sara",
            "orario_entrata": "09:00",
            "orario_uscita": "12:30",
            "pausa_minuti": "30",
            "attivita_checklist": ["Pulizia pavimenti", "Pulizia lavello"],
            "submit_action": "Completato",
        },
    )
    assert response.status_code == 302
    with app.app_context():
        report = ReportPulizia.query.order_by(ReportPulizia.id.desc()).first()
        assert report.stato == "Completato"
        assert report.totale_ore == 3.0


def test_none_anomaly_excludes_other_anomalies(client, app):
    client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "cliente": "Casa Blu",
            "operatore": "Sara",
            "attivita_svolte": "Pulizia generale",
            "anomalie": ["Nessuna anomalia", "Bagno in condizioni critiche"],
        },
    )
    with app.app_context():
        report = ReportPulizia.query.order_by(ReportPulizia.id.desc()).first()
        assert report.anomalie == "- Nessuna anomalia"


def test_admin_dashboard(client):
    response = client.get("/admin")
    assert response.status_code == 200
    assert b"Dashboard Admin" in response.data
    assert b"Admin e operatori" in response.data
    assert b"Diagnostica" in response.data


def test_admin_diagnostics(client):
    response = client.get("/admin/diagnostics")
    assert response.status_code == 200
    assert b"Diagnostica sistema" in response.data
    assert b"Database SQLite" in response.data
    assert b"Interconnessioni route" in response.data
    assert b"Generazione PDF" in response.data


def test_operator_cannot_access_admin(client):
    login_as(client, "operatore", "operatore123")
    response = client.get("/admin")
    assert response.status_code == 403
    response = client.get("/admin/diagnostics")
    assert response.status_code == 403


def test_operator_report_visibility_is_limited(client):
    client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "cliente": "Cliente Admin",
            "operatore": "Responsabile",
            "attivita_svolte": "Controllo qualita",
        },
    )
    login_as(client, "operatore", "operatore123")
    client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "cliente": "Cliente Operatore",
            "attivita_svolte": "Pulizia camere",
        },
    )

    response = client.get("/")

    assert response.status_code == 200
    assert b"Cliente Operatore" in response.data
    assert b"Cliente Admin" not in response.data


def test_admin_can_update_report_status(client, app):
    create_response = client.post(
        "/reports",
        data={
            "data": "2026-05-18",
            "cliente": "Cliente Stato",
            "operatore": "Responsabile",
            "attivita_svolte": "Controllo qualita",
        },
        follow_redirects=False,
    )
    report_id = int(create_response.headers["Location"].rsplit("/", 1)[-1])

    response = client.post(f"/admin/reports/{report_id}/status", data={"stato": "Approvato"})

    assert response.status_code == 302
    with app.app_context():
        assert db.session.get(ReportPulizia, report_id).stato == "Approvato"


def test_admin_can_create_and_disable_operator(client):
    response = client.post(
        "/admin/users",
        data={
            "display_name": "Operatore Vendita",
            "username": "vendita",
            "password": "vendita123",
            "role": "operatore",
        },
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Operatore Vendita" in response.data

    login_as(client, "vendita", "vendita123")
    assert client.get("/reports/new").status_code == 200

    login_as(client, "admin", "admin123")
    admin_page = client.get("/admin")
    assert b"vendita" in admin_page.data


def test_healthcheck(client):
    client.post("/logout")
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_new_report_loads_markdown_activity_plans(client):
    response = client.get("/reports/new")
    assert response.status_code == 200
    assert b"Procedura operativa" in response.data
    assert b"Piano Pulizia Uffici" in response.data
    assert b"Piano Pulizia Villa" in response.data
    assert b"Piano Pulizia B&amp;B" in response.data
    assert b"Piano Pulizia Appartamento Privato" in response.data
    assert b"Svuotamento cestini" in response.data


def test_new_report_loads_bedroom_linen_tasks(client):
    response = client.get("/reports/new")
    assert response.status_code == 200
    assert b"Rifacimento letto matrimoniale" in response.data
    assert b"Rifacimento letto singolo" in response.data
    assert b"Cambio lenzuola completo" in response.data
    assert b"Cambio fodera cuscino" in response.data
    assert b"Cambio copriletto" in response.data
    assert b"Cambio piumone" in response.data


def test_new_report_loads_hospitality_and_towel_tasks(client):
    response = client.get("/reports/new")
    assert response.status_code == 200
    assert b"Cambio coprilenzuolo" in response.data
    assert b"Cambio asciugamano viso" in response.data
    assert b"Cambio asciugamano doccia" in response.data
    assert b"Cambio tappetino bagno" in response.data
    assert b"Inserimento kit benvenuto Basic" in response.data
    assert b"Inserimento kit benvenuto Premium" in response.data
    assert b"Inserimento kit benvenuto Luxury" in response.data


def test_new_report_has_mobile_first_controls(client):
    response = client.get("/reports/new")
    assert response.status_code == 200
    assert b"step-rail" in response.data
    assert b"activity-search" in response.data
    assert b"selected-count" in response.data
    assert b"mobile-bottom-actions" in response.data


def test_new_report_has_select_all_for_activity_sections(client):
    response = client.get("/reports/new")
    assert response.status_code == 200
    assert b"select-section-button" in response.data
    assert b"Seleziona tutto" in response.data


def test_new_report_has_complete_group_packages(client):
    response = client.get("/reports/new")
    assert response.status_code == 200
    assert b"Pulizia generale completa" in response.data
    assert b"Pulizia cucina completa" in response.data
    assert b"Pulizia bagni completa" in response.data
    assert b"Pulizia camere completa" in response.data
    assert b"Pulizia vetri e infissi completa" in response.data
    assert b"Kit benvenuto completo" in response.data


def test_admin_dashboard_shows_editable_activity_packages(client):
    response = client.get("/admin")
    assert response.status_code == 200
    assert b"Pacchetti attivit" in response.data
    assert b"Crea pacchetto" in response.data
    assert b"Sincronizza base" in response.data
    assert b"Pulizia cucina completa" in response.data
    assert b"Salva modifiche" in response.data


def test_admin_package_validation_shows_message(client):
    response = client.post(
        "/admin/packages",
        data={"name": "", "activities": ""},
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Inserisci nome pacchetto" in response.data


def test_admin_can_create_activity_package_used_in_new_report(client):
    response = client.post(
        "/admin/packages",
        data={
            "name": "Pacchetto Extra Test",
            "sort_order": "1",
            "activities": "Pulizia forno\nCambio asciugamani extra",
        },
        follow_redirects=False,
    )
    assert response.status_code == 302

    new_report = client.get("/reports/new")
    assert b"Pacchetto Extra Test" in new_report.data
    assert b"Pulizia forno" in new_report.data
    assert b"Cambio asciugamani extra" in new_report.data


def test_admin_can_update_and_disable_activity_package(client, app):
    with app.app_context():
        package = ActivityPackage.query.filter_by(name="Pulizia cucina completa").first()
        assert package is not None
        package_id = package.id

    update_response = client.post(
        f"/admin/packages/{package_id}",
        data={
            "name": "Pacchetto Cucina Gold",
            "sort_order": "2",
            "activities": "Pulizia piano cucina\nPulizia forno gold",
            "active": "on",
        },
        follow_redirects=False,
    )
    assert update_response.status_code == 302

    new_report = client.get("/reports/new")
    assert b"Pacchetto Cucina Gold" in new_report.data
    assert b"Pulizia forno gold" in new_report.data

    toggle_response = client.post(f"/admin/packages/{package_id}/toggle", follow_redirects=False)
    assert toggle_response.status_code == 302

    new_report = client.get("/reports/new")
    assert b'<option value="Pacchetto Cucina Gold"' not in new_report.data


def test_admin_can_sync_missing_default_activity_packages(client, app):
    with app.app_context():
        package = ActivityPackage.query.filter_by(name="Pulizia cucina completa").first()
        assert package is not None
        db.session.delete(package)
        db.session.commit()

    missing_report = client.get("/reports/new")
    assert b"Pulizia cucina completa" not in missing_report.data

    response = client.post("/admin/packages/sync-defaults", follow_redirects=True)
    assert response.status_code == 200
    assert b"Sincronizzazione completata" in response.data
    assert b"Pulizia cucina completa" in response.data

    new_report = client.get("/reports/new")
    assert b"Pulizia cucina completa" in new_report.data


def test_admin_dashboard_shows_editable_operational_procedures(client):
    response = client.get("/admin")
    assert response.status_code == 200
    assert b"Procedure operative" in response.data
    assert b"Crea procedura" in response.data
    assert b"Sincronizza Markdown" in response.data
    assert b"Piano Pulizia Uffici" in response.data
    assert b"Piano Pulizia Villa" in response.data
    assert b"Piano Pulizia B&amp;B" in response.data
    assert b"Piano Pulizia Appartamento Privato" in response.data
    assert b"Salva procedura" in response.data


def test_admin_procedure_validation_shows_message(client):
    response = client.post(
        "/admin/procedures",
        data={"title": "", "activities": ""},
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert b"Inserisci titolo procedura" in response.data


def test_admin_can_create_operational_procedure_used_in_new_report(client):
    response = client.post(
        "/admin/procedures",
        data={
            "title": "Procedura Extra Test",
            "sort_order": "1",
            "activities": "Controllo chiavi\nFoto fine intervento",
        },
        follow_redirects=False,
    )
    assert response.status_code == 302

    new_report = client.get("/reports/new")
    assert b"Procedura Extra Test" in new_report.data
    assert b"Controllo chiavi" in new_report.data
    assert b"Foto fine intervento" in new_report.data


def test_admin_can_update_and_disable_operational_procedure(client, app):
    with app.app_context():
        procedure = OperationalProcedure.query.filter_by(title="Piano Pulizia Uffici").first()
        assert procedure is not None
        procedure_id = procedure.id

    update_response = client.post(
        f"/admin/procedures/{procedure_id}",
        data={
            "title": "Procedura Uffici Gold",
            "sort_order": "2",
            "activities": "Brief iniziale\nControllo sale riunioni",
            "active": "on",
        },
        follow_redirects=False,
    )
    assert update_response.status_code == 302

    new_report = client.get("/reports/new")
    assert b"Procedura Uffici Gold" in new_report.data
    assert b"Controllo sale riunioni" in new_report.data

    toggle_response = client.post(f"/admin/procedures/{procedure_id}/toggle", follow_redirects=False)
    assert toggle_response.status_code == 302

    new_report = client.get("/reports/new")
    assert b">Procedura Uffici Gold</option>" not in new_report.data


def test_admin_can_sync_missing_default_operational_procedures(client, app):
    with app.app_context():
        procedure = OperationalProcedure.query.filter_by(title="Piano Pulizia Uffici").first()
        assert procedure is not None
        db.session.delete(procedure)
        db.session.commit()

    missing_report = client.get("/reports/new")
    assert b"Piano Pulizia Uffici" not in missing_report.data

    response = client.post("/admin/procedures/sync-defaults", follow_redirects=True)
    assert response.status_code == 200
    assert b"Sincronizzazione completata" in response.data
    assert b"Piano Pulizia Uffici" in response.data

    new_report = client.get("/reports/new")
    assert b"Piano Pulizia Uffici" in new_report.data


def test_load_activity_plans_reads_md_files(tmp_path: Path):
    plan_dir = tmp_path / "piani"
    plan_dir.mkdir()
    (plan_dir / "piano_test.md").write_text(
        "# Piano Test\n\n## Attivita svolte\n\n- Pulizia ingresso\n- Lavaggio pavimenti\n",
        encoding="utf-8",
    )

    plans = load_activity_plans(tmp_path)

    assert len(plans) == 1
    assert plans[0].title == "Piano Test"
    assert plans[0].activities == "- Pulizia ingresso\n- Lavaggio pavimenti"


def test_report_template_fields_are_loaded_from_markdown(tmp_path: Path):
    template_dir = tmp_path / "templates"
    template_dir.mkdir()
    (template_dir / "report_template.md").write_text(
        "# Report\n\n- Data:\n- Sede:\n- Operatore:\n- Attivita svolte:\n- Note:\n- Firma:\n",
        encoding="utf-8",
    )

    fields = load_report_template_fields(tmp_path)

    assert [field.key for field in fields] == [
        "data",
        "sede",
        "operatore",
        "attivita_svolte",
        "note",
        "firma",
    ]
