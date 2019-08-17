DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS petition;
DROP TABLE IF EXISTS user_profiles;

CREATE TABLE petition (
    id SERIAL PRIMARY KEY,
    user_id INT,
    signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR (50) UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR (100),
    homepage VARCHAR (300),
    user_id INT REFERENCES users(id) UNIQUE
);
