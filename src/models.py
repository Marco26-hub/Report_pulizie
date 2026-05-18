from __future__ import annotations

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(30), nullable=False, default="operatore", index=True)
    active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


class ReportPulizia(db.Model):
    __tablename__ = "report_pulizie"

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.Date, nullable=False, index=True)
    sede = db.Column(db.String(120), nullable=False, index=True)
    operatore = db.Column(db.String(120), nullable=False, index=True)
    cliente = db.Column(db.String(160), nullable=True, index=True)
    indirizzo = db.Column(db.String(240), nullable=True)
    tipologia_immobile = db.Column(db.String(80), nullable=True, index=True)
    orario_entrata = db.Column(db.String(5), nullable=True)
    orario_uscita = db.Column(db.String(5), nullable=True)
    pausa_minuti = db.Column(db.Integer, nullable=False, default=0)
    totale_ore = db.Column(db.Float, nullable=False, default=0)
    attivita_svolte = db.Column(db.Text, nullable=False)
    anomalie = db.Column(db.Text, nullable=True)
    note_anomalia = db.Column(db.Text, nullable=True)
    note = db.Column(db.Text, nullable=True)
    firma = db.Column(db.String(120), nullable=True)
    external_video_link = db.Column(db.String(500), nullable=True)
    external_video_description = db.Column(db.Text, nullable=True)
    stato = db.Column(db.String(30), nullable=False, default="Bozza", index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    photos = db.relationship("ReportPhoto", backref="report", cascade="all, delete-orphan", lazy=True)
    sends = db.relationship("ReportSend", backref="report", cascade="all, delete-orphan", lazy=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "data": self.data.isoformat(),
            "sede": self.sede,
            "operatore": self.operatore,
            "cliente": self.cliente or self.sede,
            "indirizzo": self.indirizzo or "",
            "tipologia_immobile": self.tipologia_immobile or "",
            "orario_entrata": self.orario_entrata or "",
            "orario_uscita": self.orario_uscita or "",
            "pausa_minuti": self.pausa_minuti,
            "totale_ore": self.totale_ore,
            "attivita_svolte": self.attivita_svolte,
            "anomalie": self.anomalie or "",
            "note_anomalia": self.note_anomalia or "",
            "note": self.note or "",
            "firma": self.firma or "",
            "external_video_link": self.external_video_link or "",
            "external_video_description": self.external_video_description or "",
            "stato": self.stato,
            "created_at": self.created_at.isoformat(),
        }


class ReportPhoto(db.Model):
    __tablename__ = "report_photos"

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report_pulizie.id"), nullable=False, index=True)
    filename = db.Column(db.String(240), nullable=False)
    original_filename = db.Column(db.String(240), nullable=False)
    categoria = db.Column(db.String(80), nullable=False)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)


class ReportSend(db.Model):
    __tablename__ = "report_sends"

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report_pulizie.id"), nullable=False, index=True)
    canale = db.Column(db.String(40), nullable=False)
    messaggio = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)


class ActivityPackage(db.Model):
    __tablename__ = "activity_packages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True, index=True)
    activities = db.Column(db.Text, nullable=False, default="")
    active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def activities_list(self) -> list[str]:
        items: list[str] = []
        for line in self.activities.splitlines():
            item = line.strip()
            if item.startswith("- "):
                item = item[2:].strip()
            if item:
                items.append(item)
        return items


class OperationalProcedure(db.Model):
    __tablename__ = "operational_procedures"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False, unique=True, index=True)
    activities = db.Column(db.Text, nullable=False, default="")
    source = db.Column(db.String(240), nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def activities_list(self) -> list[str]:
        items: list[str] = []
        for line in self.activities.splitlines():
            item = line.strip()
            if item.startswith("- "):
                item = item[2:].strip()
            if item:
                items.append(item)
        return items
