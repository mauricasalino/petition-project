var spicedPg = require('spiced-pg');
const bc = require('./bc');

let db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg('postgres:postgres:postgres@localhost:5432/users');
}

exports.addSign = function addSign(signature, user_id) {
    return db.query(
        `INSERT INTO petition (signature, user_id)
         VALUES ($1, $2) RETURNING id`,
        [signature, user_id]
    );
};

exports.addUser = function addUser(first_name, last_name, email, password) {
    return db.query(
        `INSERT INTO users (first_name, last_name, email, password, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`,
        [first_name, last_name, email, password]
    );
};

exports.addTellUsMore = function addTellUsMore(age, city, homepage, user_id) {
    return db.query(
        `INSERT INTO user_profiles (age, city, homepage, user_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [age, city, homepage, user_id]
    );
};

exports.getSigs = function getSigs() {
    return db.query(`
        SELECT first_name, last_name, age, city, homepage
        FROM petition
        LEFT JOIN users
        ON petition.user_id = users.id
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        `);
};



exports.getPasswordCheckIfSigned = function(email) {
    return db.query(
        `
        SELECT users.password, users.id, signature
        FROM users
        JOIN petition
        ON users.id = petition.user_id
        WHERE users.email=$1`, [email]);
};

exports.getSignatureUrl = function getSignatureUrl(userId) {
    return db.query(`
        SELECT user_id, first_name, last_name, signature
        FROM users
        JOIN petition
        ON users.id = petition.user_id
        WHERE user_id = $1`, [userId]);
};

exports.getAmountSigners = function getAmountSigners() {
    return db.query(`SELECT COUNT(*) FROM petition;`);
};

exports.deleteSignature = function deleteSignature(user_id) {
    return db.query(
        `DELETE FROM petition
    WHERE user_id = $1`,
        [user_id]
    );
};

exports.getProfileData = function getProfileData(user_id) {
    return db.query(`
        SELECT users.first_name AS first_name, users.last_name AS last_name, users.email AS email, user_profiles.age AS age, user_profiles.city AS city, user_profiles.homepage AS homepage
        FROM users
        LEFT OUTER JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1
        `, [user_id]);
};

exports.postProfileData = function postProfileData(user_id, first_name, last_name, email, age, city, homepage) {
    return db.query(`
        UPDATE user_profiles (user_id, first_name, last_name, email, age, city, homepage)
        SET ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $2, city = $3, homepage = $4`,
    [user_id, first_name, last_name, email, age, city, homepage]
    );
};

exports.postProfileData = function postProfileData(user_id, first_name, last_name, email, age, city, homepage) {
    return db.query(
        `INSERT INTO users (first_name, last_name, email, city, homepage, password, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`,
        [first_name, last_name, email, age, city, homepage]
    );
};

exports.updateUsers = function(id, first_name, last_name, email) {
    console.log(id, first_name, last_name, email);
    return db.query(
        "UPDATE users SET first_name=$2, last_name=$3, email=$4 WHERE id=$1",
        [id, first_name, last_name, email]
    );
};

exports.updateUserProfiles = function(user_id, age, city, homepage) {
    return db.query(
        "INSERT INTO user_profiles (user_id, age, city, homepage) VALUES ($1, $2, $3, $4) ON CONFLICT(user_id) DO UPDATE SET age=$2, city=$3, homepage=$4",
        [user_id, age || null, city || null, homepage || null]
    );
};

exports.updateUsersDataWithPassword = function updateUsersDataWithPassword(
    user_id,
    first_name,
    last_name,
    email,
    password
) {
    //used on profile page
    return db.query(
        `
        UPDATE users
        SET first_name = ($2),
        last_name = ($3),
        email = ($4),
        password = ($5)
        WHERE id = ($1);
    `,
        [user_id, first_name, last_name, email, password]
    );
};

exports.updateUsersDataWithoutPassword = function updateUsersDataWithoutPassword(
    id,
    first_name,
    last_name,
    email
) {
    return db.query(
        `
        UPDATE users
        SET first_name = ($2),
        last_name = ($3),
        email = ($4)
        WHERE id = ($1);
    `,
        [id, first_name, last_name, email]
    );
};

exports.updateUserProfilesData = function updateUserProfilesData(
    user_id,
    age,
    city,
    homepage
) {
    return db.query(
        `
    INSERT INTO user_profiles (user_id, age, city, homepage)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = ($2), city = ($3), homepage = ($4);
    `,
        [user_id, age, city, homepage]
    );
};
