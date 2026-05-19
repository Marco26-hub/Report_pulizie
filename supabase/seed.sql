-- Seed default templates per company.
-- Call: select seed_default_templates('<company_uuid>');

create or replace function seed_default_templates(p_company_id uuid)
returns void language plpgsql as $$
declare
  t_app uuid; t_villa uuid; t_bnb uuid; t_ord uuid;
  t_deep uuid; t_post uuid; t_office uuid; t_custom uuid;
begin
  insert into report_templates(company_id, name, description, is_default) values
    (p_company_id, 'Appartamento standard', 'Pulizia ordinaria appartamento', true) returning id into t_app;
  insert into report_templates(company_id, name, description) values
    (p_company_id, 'Villa completa', 'Pulizia completa villa') returning id into t_villa;
  insert into report_templates(company_id, name, description) values
    (p_company_id, 'B&B check-in/check-out', 'Turnover B&B / casa vacanza') returning id into t_bnb;
  insert into report_templates(company_id, name, description) values
    (p_company_id, 'Pulizia ordinaria', 'Ordinaria base') returning id into t_ord;
  insert into report_templates(company_id, name, description) values
    (p_company_id, 'Pulizia profonda', 'Pulizia profonda') returning id into t_deep;
  insert into report_templates(company_id, name, description) values
    (p_company_id, 'Pulizia post cantiere', 'Dopo lavori edili') returning id into t_post;
  insert into report_templates(company_id, name, description) values
    (p_company_id, 'Ufficio', 'Pulizia ufficio') returning id into t_office;
  insert into report_templates(company_id, name, description) values
    (p_company_id, 'Personalizzato', 'Vuoto, da personalizzare') returning id into t_custom;

  -- Helper: insert checklist with all sections into a template
  perform _insert_full_checklist(t_app);
  perform _insert_full_checklist(t_villa);
  perform _insert_full_checklist(t_bnb);
  perform _insert_full_checklist(t_ord);
  perform _insert_full_checklist(t_deep);
  perform _insert_full_checklist(t_post);
  perform _insert_full_checklist(t_office);
end $$;

create or replace function _insert_full_checklist(p_template_id uuid)
returns void language plpgsql as $$
begin
  insert into template_tasks(template_id, section, label, sort_order) values
  (p_template_id,'Pulizia generale','Spolvero superfici accessibili',1),
  (p_template_id,'Pulizia generale','Pulizia pavimenti',2),
  (p_template_id,'Pulizia generale','Lavaggio pavimenti',3),
  (p_template_id,'Pulizia generale','Pulizia battiscopa',4),
  (p_template_id,'Pulizia generale','Pulizia porte interne',5),
  (p_template_id,'Pulizia generale','Pulizia maniglie',6),
  (p_template_id,'Pulizia generale','Pulizia interruttori',7),
  (p_template_id,'Pulizia generale','Rimozione ragnatele',8),
  (p_template_id,'Pulizia generale','Rimozione capelli',9),
  (p_template_id,'Pulizia generale','Rimozione peli animali',10),
  (p_template_id,'Pulizia generale','Svuotamento cestini',11),

  (p_template_id,'Cucina','Pulizia piano cucina',1),
  (p_template_id,'Cucina','Pulizia lavello',2),
  (p_template_id,'Cucina','Pulizia rubinetteria',3),
  (p_template_id,'Cucina','Pulizia piano cottura',4),
  (p_template_id,'Cucina','Pulizia cappa esterna',5),
  (p_template_id,'Cucina','Pulizia elettrodomestici esterni',6),
  (p_template_id,'Cucina','Pulizia esterna mobili cucina',7),
  (p_template_id,'Cucina','Pulizia tavolo e sedie',8),
  (p_template_id,'Cucina','Pulizia piastrelle/paraschizzi',9),

  (p_template_id,'Bagni','Pulizia e igienizzazione sanitari',1),
  (p_template_id,'Bagni','Pulizia lavabo',2),
  (p_template_id,'Bagni','Pulizia doccia/vasca',3),
  (p_template_id,'Bagni','Pulizia box doccia',4),
  (p_template_id,'Bagni','Pulizia specchi',5),
  (p_template_id,'Bagni','Pulizia rubinetteria',6),
  (p_template_id,'Bagni','Rimozione calcare leggero',7),
  (p_template_id,'Bagni','Pulizia piastrelle zona acqua',8),
  (p_template_id,'Bagni','Lavaggio pavimento bagno',9),
  (p_template_id,'Bagni','Controllo carta igienica/sapone',10),

  (p_template_id,'Camere','Spolvero comodini e mobili',1),
  (p_template_id,'Camere','Pulizia superfici accessibili',2),
  (p_template_id,'Camere','Pulizia armadi esterni',3),
  (p_template_id,'Camere','Pulizia specchi',4),
  (p_template_id,'Camere','Aspirazione pavimenti',5),
  (p_template_id,'Camere','Lavaggio pavimenti',6),
  (p_template_id,'Camere','Pulizia sotto i letti',7),
  (p_template_id,'Camere','Controllo zone nascoste',8),
  (p_template_id,'Camere','Controllo lenzuola pulite',9),
  (p_template_id,'Camere','Cambio lenzuola',10),
  (p_template_id,'Camere','Preparazione letto',11),

  (p_template_id,'Soggiorno/living','Spolvero mobili e superfici',1),
  (p_template_id,'Soggiorno/living','Pulizia tavoli',2),
  (p_template_id,'Soggiorno/living','Pulizia sedie',3),
  (p_template_id,'Soggiorno/living','Pulizia librerie accessibili',4),
  (p_template_id,'Soggiorno/living','Aspirazione divani/tappeti',5),
  (p_template_id,'Soggiorno/living','Lavaggio pavimenti',6),
  (p_template_id,'Soggiorno/living','Rimozione polvere elementi decorativi',7),

  (p_template_id,'Vetri e infissi','Pulizia vetri interni',1),
  (p_template_id,'Vetri e infissi','Pulizia vetri esterni in sicurezza',2),
  (p_template_id,'Vetri e infissi','Pulizia davanzali',3),
  (p_template_id,'Vetri e infissi','Pulizia infissi',4),
  (p_template_id,'Vetri e infissi','Pulizia tapparelle/persiane',5),
  (p_template_id,'Vetri e infissi','Pulizia zanzariere',6),

  (p_template_id,'Zone alte e sicurezza','Pulizia mensole alte',1),
  (p_template_id,'Zone alte e sicurezza','Spolvero superfici alte',2),
  (p_template_id,'Zone alte e sicurezza','Rimozione ragnatele angoli alti',3),

  (p_template_id,'Esterni','Pulizia balconi',1),
  (p_template_id,'Esterni','Pulizia terrazzi',2),
  (p_template_id,'Esterni','Spazzamento aree esterne',3),
  (p_template_id,'Esterni','Lavaggio pavimentazione esterna',4),
  (p_template_id,'Esterni','Pulizia ringhiere',5),
  (p_template_id,'Esterni','Rimozione foglie/sporco superficiale',6);
end $$;
