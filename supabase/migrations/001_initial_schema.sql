-- ============================================================
-- Said Coach — Schema inicial
-- ============================================================

-- Perfil del entrenador (branding + configuración)
CREATE TABLE trainer_profile (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users NOT NULL UNIQUE,
  brand_name    text NOT NULL DEFAULT 'Said Coach',
  logo_url      text,
  primary_color text DEFAULT '#18181b',
  accent_color  text DEFAULT '#f97316',
  tagline       text,
  created_at    timestamptz DEFAULT now()
);

-- Alumnos del entrenador
CREATE TABLE clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id    uuid REFERENCES trainer_profile(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid REFERENCES auth.users,
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text,
  notes         text,
  status        text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(trainer_id, email)
);

-- Biblioteca de ejercicios (globales + del entrenador)
CREATE TABLE exercises (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id    uuid REFERENCES trainer_profile(id) ON DELETE CASCADE,
  name          text NOT NULL,
  category      text CHECK (category IN ('push', 'pull', 'legs', 'core', 'cardio', 'mobility', 'other')),
  muscle_group  text,
  description   text,
  video_url     text,
  image_url     text,
  is_global     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- Programas de entrenamiento
CREATE TABLE programs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id      uuid REFERENCES trainer_profile(id) ON DELETE CASCADE NOT NULL,
  title           text NOT NULL,
  description     text,
  duration_weeks  int DEFAULT 4,
  goal            text CHECK (goal IN ('strength', 'hypertrophy', 'fat_loss', 'endurance', 'general')),
  difficulty      text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_template     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Sesiones dentro de un programa
CREATE TABLE workouts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id              uuid REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  title                   text NOT NULL,
  week_number             int DEFAULT 1,
  day_number              int DEFAULT 1,
  notes                   text,
  estimated_duration_min  int,
  order_index             int DEFAULT 0,
  created_at              timestamptz DEFAULT now()
);

-- Ejercicios dentro de una sesión
CREATE TABLE workout_exercises (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id      uuid REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id     uuid REFERENCES exercises(id) ON DELETE RESTRICT NOT NULL,
  order_index     int NOT NULL DEFAULT 0,
  sets            int,
  reps            text,        -- "8-12", "AMRAP", "10"
  weight          text,        -- "70kg", "RPE 8", "peso corporal"
  rest_seconds    int,
  tempo           text,        -- "3-1-2-0"
  notes           text,
  superset_group  int          -- ejercicios con el mismo valor forman un superset
);

-- Asignación de programas a alumnos
CREATE TABLE client_programs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  program_id  uuid REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  start_date  date,
  end_date    date,
  status      text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  UNIQUE(client_id, program_id)
);

-- Registros de entrenamiento del alumno (por sesión)
CREATE TABLE workout_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  workout_id        uuid REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  logged_at         timestamptz DEFAULT now(),
  completed         boolean DEFAULT false,
  notes_text        text,
  notes_audio_url   text,
  perceived_effort  int CHECK (perceived_effort BETWEEN 1 AND 10),
  duration_min      int
);

-- Registros por ejercicio dentro de una sesión logueada
CREATE TABLE exercise_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id        uuid REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  workout_exercise_id   uuid REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number            int NOT NULL,
  reps_done             text,
  weight_done           text,
  notes                 text
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE trainer_profile    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_programs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs      ENABLE ROW LEVEL SECURITY;

-- trainer_profile: cada usuario ve/edita solo su perfil
CREATE POLICY "trainer_own_profile" ON trainer_profile
  FOR ALL USING (user_id = auth.uid());

-- clients: el entrenador ve solo sus alumnos
CREATE POLICY "trainer_own_clients" ON clients
  FOR ALL USING (
    trainer_id IN (SELECT id FROM trainer_profile WHERE user_id = auth.uid())
  );

-- Los alumnos pueden verse a sí mismos
CREATE POLICY "client_self" ON clients
  FOR SELECT USING (user_id = auth.uid());

-- exercises: globales (is_global=true) visibles para todos; propias solo para el entrenador
CREATE POLICY "exercises_global" ON exercises
  FOR SELECT USING (is_global = true);

CREATE POLICY "exercises_trainer_own" ON exercises
  FOR ALL USING (
    trainer_id IN (SELECT id FROM trainer_profile WHERE user_id = auth.uid())
  );

-- programs: el entrenador ve/edita los suyos
CREATE POLICY "trainer_own_programs" ON programs
  FOR ALL USING (
    trainer_id IN (SELECT id FROM trainer_profile WHERE user_id = auth.uid())
  );

-- Los alumnos ven los programas asignados a ellos
CREATE POLICY "client_assigned_programs" ON programs
  FOR SELECT USING (
    id IN (
      SELECT cp.program_id FROM client_programs cp
      JOIN clients c ON cp.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- workouts: heredan acceso del programa
CREATE POLICY "trainer_own_workouts" ON workouts
  FOR ALL USING (
    program_id IN (
      SELECT id FROM programs WHERE trainer_id IN (
        SELECT id FROM trainer_profile WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "client_assigned_workouts" ON workouts
  FOR SELECT USING (
    program_id IN (
      SELECT cp.program_id FROM client_programs cp
      JOIN clients c ON cp.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- workout_exercises
CREATE POLICY "trainer_own_workout_exercises" ON workout_exercises
  FOR ALL USING (
    workout_id IN (
      SELECT w.id FROM workouts w
      JOIN programs p ON w.program_id = p.id
      WHERE p.trainer_id IN (SELECT id FROM trainer_profile WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "client_assigned_workout_exercises" ON workout_exercises
  FOR SELECT USING (
    workout_id IN (
      SELECT w.id FROM workouts w
      JOIN client_programs cp ON w.program_id = cp.program_id
      JOIN clients c ON cp.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- client_programs
CREATE POLICY "trainer_own_client_programs" ON client_programs
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainer_profile tp ON c.trainer_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

CREATE POLICY "client_own_assignments" ON client_programs
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- workout_logs: solo el propio alumno
CREATE POLICY "client_own_workout_logs" ON workout_logs
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- El entrenador puede ver los logs de sus alumnos
CREATE POLICY "trainer_view_workout_logs" ON workout_logs
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN trainer_profile tp ON c.trainer_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

-- exercise_logs
CREATE POLICY "client_own_exercise_logs" ON exercise_logs
  FOR ALL USING (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl
      JOIN clients c ON wl.client_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "trainer_view_exercise_logs" ON exercise_logs
  FOR SELECT USING (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl
      JOIN clients c ON wl.client_id = c.id
      JOIN trainer_profile tp ON c.trainer_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

-- ============================================================
-- Seed: ejercicios globales comunes
-- ============================================================

INSERT INTO exercises (name, category, muscle_group, is_global, video_url) VALUES
  ('Sentadilla con barra', 'legs', 'Cuádriceps, glúteos', true, NULL),
  ('Peso muerto', 'legs', 'Isquiotibiales, espalda baja, glúteos', true, NULL),
  ('Press de banca', 'push', 'Pecho, tríceps, deltoides anterior', true, NULL),
  ('Press militar', 'push', 'Deltoides, tríceps', true, NULL),
  ('Dominadas', 'pull', 'Dorsal, bíceps', true, NULL),
  ('Remo con barra', 'pull', 'Dorsal, bíceps, romboides', true, NULL),
  ('Curl de bíceps', 'pull', 'Bíceps', true, NULL),
  ('Extensión de tríceps', 'push', 'Tríceps', true, NULL),
  ('Hip Thrust', 'legs', 'Glúteos', true, NULL),
  ('Zancadas', 'legs', 'Cuádriceps, glúteos', true, NULL),
  ('Plancha', 'core', 'Core, abdominales', true, NULL),
  ('Crunch abdominal', 'core', 'Abdominales', true, NULL),
  ('Remo con mancuerna', 'pull', 'Dorsal, bíceps', true, NULL),
  ('Press inclinado con mancuernas', 'push', 'Pecho superior', true, NULL),
  ('Elevaciones laterales', 'push', 'Deltoides lateral', true, NULL),
  ('Face Pull', 'pull', 'Deltoides posterior, romboides', true, NULL),
  ('Hip Hinge con banda', 'legs', 'Isquiotibiales, glúteos', true, NULL),
  ('Sentadilla goblet', 'legs', 'Cuádriceps, glúteos, core', true, NULL),
  ('Push-up', 'push', 'Pecho, tríceps', true, NULL),
  ('Burpee', 'cardio', 'Cuerpo completo', true, NULL),
  ('Mountain climber', 'core', 'Core, cardiovascular', true, NULL),
  ('Salto a la cuerda', 'cardio', 'Cardiovascular', true, NULL);
