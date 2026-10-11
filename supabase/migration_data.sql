-- DATA MIGRATION SCRIPT FOR GORILLA MENTALITY
-- This script populates the exercises and templates tables with the data from training.ts

-- 1. CLEAR EXISTING DATA (For clean migration)
TRUNCATE workout_templates CASCADE;
TRUNCATE exercises CASCADE;

-- 2. INSERT EXERCISES
-- We use a temporary table to avoid duplicates and handle the many-to-many relationship
CREATE TEMP TABLE raw_exercises (name TEXT, muscle_group TEXT);

INSERT INTO raw_exercises (name, muscle_group) VALUES
-- Chest/Arms
('Incline or flat barbell bench press', 'Chest'),
('Chest fly', 'Chest'),
('Seated chest press', 'Chest'),
('Triceps pushdown', 'Triceps'),
('Machine biceps curl', 'Biceps'),
('Shoulder press', 'Shoulders'),
('Standing hammer curls', 'Biceps'),
('Rope triceps pushdown', 'Triceps'),
('Flat barbell bench press', 'Chest'),
('Machine rows', 'Back'),
('Lat pulldowns', 'Back'),
('Cable rows', 'Back'),
('Biceps curls', 'Biceps'),
('Machine triceps press', 'Triceps'),
('Overhead triceps extension', 'Triceps'),
('Triceps pushdown burnout', 'Triceps'),
-- Legs/Core
('Hack squat', 'Quads'),
('Leg press', 'Quads'),
('Leg extensions', 'Quads'),
('Calf raises', 'Calves'),
('Crunch machine', 'Core'),
('Back extension machine', 'Core'),
-- Female Focused
('Barbell hip thrust', 'Glutes'),
('Romanian deadlift', 'Hamstrings'),
('Seated or lying hamstring curl', 'Hamstrings'),
('Cable glute kickback', 'Glutes'),
('Hip abductor machine', 'Glutes'),
('Standing calf raises', 'Calves'),
('Lat pulldown', 'Back'),
('Seated cable row', 'Back'),
('Dumbbell shoulder press', 'Shoulders'),
('Lateral raises', 'Shoulders'),
('Face pulls', 'Shoulders'),
('Dumbbell biceps curls', 'Biceps'),
('Triceps rope pushdown', 'Triceps'),
('Hack squat or smith squat', 'Quads'),
('Bulgarian split squat', 'Quads'),
('Walking lunges', 'Quads'),
('Cable abductions', 'Glutes'),
('Chest press machine', 'Chest'),
('Assisted pull-up or pulldown', 'Back'),
('Rear delt fly', 'Shoulders'),
('Cable crunch', 'Core'),
('Plank', 'Core'),
('Hip thrust machine', 'Glutes'),
('Single-leg leg press', 'Quads'),
('Cable pull-through', 'Hamstrings'),
('Glute-focused back extension', 'Glutes'),
('Goblet squat', 'Quads'),
('Step-ups', 'Quads'),
('Cable kickbacks', 'Glutes'),
('Mobility circuit', 'Full Body');

INSERT INTO exercises (name, muscle_group)
SELECT DISTINCT name, muscle_group FROM raw_exercises;

DROP TABLE raw_exercises;

-- 3. INSERT TEMPLATES
-- Since this is a manual migration, we refer to names. 
-- In a production app, we'd use a script to loop through the training.ts arrays.

-- Example: Male Session 0 (Chest + Arms - Strength Focus)
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 1, 4, '6-10' FROM exercises WHERE name = 'Incline or flat barbell bench press';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 2, 3, '10-12' FROM exercises WHERE name = 'Chest fly';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 3, 3, '8-12' FROM exercises WHERE name = 'Seated chest press';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 4, 3, '10-12' FROM exercises WHERE name = 'Triceps pushdown';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 5, 3, '10-12' FROM exercises WHERE name = 'Machine biceps curl';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 6, 3, '8-12' FROM exercises WHERE name = 'Shoulder press';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 7, 3, '8-12' FROM exercises WHERE name = 'Standing hammer curls';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Male-Strength-ChestArms', 1, id, 8, 3, '8-12' FROM exercises WHERE name = 'Rope triceps pushdown';

-- Example: Female Session 0 (Glutes + Hamstrings - Strength)
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Female-Strength-GlutesHams', 1, id, 1, 4, '8-10' FROM exercises WHERE name = 'Barbell hip thrust';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Female-Strength-GlutesHams', 1, id, 2, 3, '8-10' FROM exercises WHERE name = 'Romanian deadlift';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Female-Strength-GlutesHams', 1, id, 3, 3, '10-12' FROM exercises WHERE name = 'Seated or lying hamstring curl';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Female-Strength-GlutesHams', 1, id, 4, 3, '12-15' FROM exercises WHERE name = 'Cable glute kickback';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Female-Strength-GlutesHams', 1, id, 5, 3, '15-20' FROM exercises WHERE name = 'Hip abductor machine';
INSERT INTO workout_templates (template_name, day_number, exercise_id, order_index, default_sets, default_reps)
SELECT 'Female-Strength-GlutesHams', 1, id, 6, 3, '12-15' FROM exercises WHERE name = 'Standing calf raises';
