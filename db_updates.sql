-- Create Database
CREATE DATABASE IF NOT EXISTS pregajourney;
USE pregajourney;

-- =============================
-- 1. Location Tables
-- =============================

CREATE TABLE countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id INT,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT,
    FOREIGN KEY (state_id) REFERENCES states(id)
);

-- =============================
-- 2. Specializations / Services / Procedures / Symptoms
-- =============================

CREATE TABLE specializations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE procedures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE symptoms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

-- =============================
-- 3. Hospitals & Clinics
-- =============================

CREATE TABLE hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    image VARCHAR(255),
    timing VARCHAR(200),
    phone_1 VARCHAR(20),
    phone_2 VARCHAR(20),
    website VARCHAR(200),
    address TEXT,
    city_id INT,
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    image VARCHAR(255),
    timing VARCHAR(200),
    phone_1 VARCHAR(20),
    phone_2 VARCHAR(20),
    website VARCHAR(200),
    address TEXT,
    city_id INT,
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- =============================
-- 4. Doctors
-- =============================

CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    specialization_id INT,
    degree VARCHAR(200),
    experience_years INT,
    registration_number VARCHAR(100),
    about TEXT,
    phone_1 VARCHAR(20),
    phone_2 VARCHAR(20),
    email VARCHAR(100),
    profile_image VARCHAR(255),
    address TEXT,
    city_id INT,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (specialization_id) REFERENCES specializations(id)
);

-- =============================
-- 5. Link Tables (Relationships)
-- =============================

-- Doctor ↔ Hospital (many-to-many)
CREATE TABLE doctor_hospital (
    doctor_id INT,
    hospital_id INT,
    PRIMARY KEY (doctor_id, hospital_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- Doctor ↔ Clinic (many-to-many)
CREATE TABLE doctor_clinic (
    doctor_id INT,
    clinic_id INT,
    PRIMARY KEY (doctor_id, clinic_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- Hospital ↔ Services (many-to-many)
CREATE TABLE hospital_services (
    hospital_id INT,
    service_id INT,
    PRIMARY KEY (hospital_id, service_id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Doctor ↔ Services (many-to-many)
CREATE TABLE doctor_services (
    doctor_id INT,
    service_id INT,
    PRIMARY KEY (doctor_id, service_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Hospital ↔ Procedures
CREATE TABLE hospital_procedures (
    hospital_id INT,
    procedure_id INT,
    PRIMARY KEY (hospital_id, procedure_id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (procedure_id) REFERENCES procedures(id)
);


ALTER TABLE cities ADD COLUMN slug VARCHAR(150);
ALTER TABLE specializations ADD COLUMN slug VARCHAR(150);
ALTER TABLE doctors ADD COLUMN slug VARCHAR(150);
ALTER TABLE hospitals ADD COLUMN slug VARCHAR(150);
ALTER TABLE clinics ADD COLUMN slug VARCHAR(150);


ALTER TABLE hospitals ADD COLUMN area VARCHAR(100);
ALTER TABLE clinics ADD COLUMN area VARCHAR(100);
ALTER TABLE doctors ADD COLUMN area VARCHAR(100);

ALTER TABLE doctors ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE doctors ADD COLUMN consultation_fee DECIMAL(10,2) DEFAULT 0;


ALTER TABLE doctors ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';
ALTER TABLE hospitals ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';
ALTER TABLE clinics ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';
