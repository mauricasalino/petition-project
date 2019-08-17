-- DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles (
id SERIAL PRIMARY KEY,
age INT,
city VARCHAR (100),
homepage VARCHAR (300),
user_id INT REFERENCES users(id)
);
