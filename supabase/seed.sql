-- Seed Shikha's Organisation Demo Institution
INSERT INTO public.institutions (id, name, slug, domain, is_demo)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Shikha's Organisation',
  'shikhas-org',
  'shikhaoorg.edu',
  true
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Categories
INSERT INTO public.categories (id, institution_id, name, slug, description, icon)
VALUES
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Rapid Prototyping & 3D Printing', '3d-printing', 'Industrial & desktop additive manufacturing, filaments, and SLA/FDM printers', 'Printer'),
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Electronics & Instrumentation', 'electronics', 'Oscilloscopes, logic analyzers, function generators, and soldering stations', 'Cpu'),
  ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Media & Audio-Visual Kit', 'media-kit', 'Cinema-grade mirrorless cameras, field audio recorders, studio lighting', 'Camera'),
  ('c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'High-Performance Computing', 'computing', 'GPU deep learning rigs, simulation servers, and cluster nodes', 'Server'),
  ('c5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Precision Workshops & CNC', 'cnc-workshops', 'Computer numerical control mills, precision lathes, and sheet metal benders', 'Wrench'),
  ('c6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Seminar & Research Spaces', 'spaces', 'Acoustic seminar rooms, collaborative meeting zones, lecture recording suites', 'Building')
ON CONFLICT (id) DO NOTHING;

-- Institutional Policies
INSERT INTO public.institutional_policies (institution_id, policy_key, policy_value)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'booking_rules', '{"max_rolling_hours_30d": 30, "min_notice_hours": 2, "max_advance_days": 14, "cancellation_grace_hours": 2}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'incident_escalation', '{"critical_severity_response_hours": 12, "damage_assessment_window_days": 3}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'supervision_matrix', '{"heavy_machinery": true, "high_voltage": true}'::jsonb)
ON CONFLICT (institution_id, policy_key) DO UPDATE SET policy_value = EXCLUDED.policy_value;


