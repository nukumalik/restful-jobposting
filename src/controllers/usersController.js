const User = require('../models/User');
const uuid = require('uuid/v4');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../helpers/redis');
const { validationResult } = require('express-validator');

module.exports = {
	getUsers: (req, res) => {
		let { id, username } = req.params;
		let { name } = req.query;

		User.getUsers(id, username)
			.then(result => {
				if (result.length < 1) {
					res.json({ message: 'User is empty' });
				} else {
					res.json(result);
				}
			})
			.catch(err => console.log(err));
	},
	loginUsers: (req, res) => {
		let { email, password } = req.body;
		// password = password.toString();
		const errors = validationResult(req);

		if(!errors.isEmpty()) {
			return res.status(400).json({
				status: 400,
				error: true,
				message: 'Failed to login',
				data: errors.array()
			});
		} else {
			User.getUsers()
				.then(result => {
					const user = result.filter(person => person.email == email);
					bcrypt.compare(password, user[0].password).then(isMatch => {
						if (isMatch) {
							User.loginUsers(email, password)
								.then(result => {
									// Payload
									const payload = {
										id: result.id,
										name: result.name,
										username: result.username,
										email: result.email,
										password: result.password
									};

									// Token
									jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
										if (err) console.log(err);
										res.json({
											status: 200,
											error: false,
											message: 'Success to login',
											id: result.id,
											token: 'Bearer ' + token
										});
									});
								})
								.catch(err => console.log(err));
						} else {
							res.json({
								status: 400,
								error: true,
								message: 'Password invalid'
							});
						}
					}).catch(err => console.log(err));
				})
				.catch(err => console.log(err));
		}
	},
	registerUsers: (req, res) => {
		const id = uuid();
		const { name, username, born, gender, address, email, password } = req.body;
		const data = { id, name, username, born, gender, address, email, password };
		const errors = validationResult(req);

		if(!errors.isEmpty()) {
			return res.status(400).json({
				status: 400,
				error: true,
				message: 'Failed to register new user',
				data: errors.array()
			});
		} else {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(data.password, salt, (err, hash) => {
					data.password = hash;
					User.registerUsers(data)
						.then(result =>
							res.json({
								status: 200,
								error: false,
								message: 'Success to register new user account',
								data: {
									name: data.name,
									username: data.username,
									born: data.born,
									gender: data.gender,
									address: data.address,
									email: data.email
								}
							})
						)
						.catch(err => console.log(err));
				});
			});
		}
	},
	updateUsers: (req, res) => {
		const { id } = req.params;
		const { name, username, born, gender, address, email, password } = req.body;
		const updated_at = new Date();

		const data = {};
		if (name) data.name = name;
		if (username) data.username = username;
		if (born) data.born = born;
		if (gender) data.gender = gender;
		if (address) data.address = address;
		if (email) data.email = email;
		if (password) {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(password, salt, (err, hash) => {
					if (err) {
						console.log(err);
					}
					password = hash;
				});
			});
			data.password = password;
		}

		User.updateUsers(data, id).then(result => {
			res.json({
				status: 200,
				error: false,
				message: `Success to update a user with ID: ${id}`,
				data
			});
		});
	},
	deleteUsers: (req, res) => {
		const { id } = req.params;

		User.deleteUsers(id)
			.then(result => {
				res.json({
					status: 200,
					error: false,
					message: `Success to delete a user with ID: ${id}`
				});
			})
			.catch(err => console.log(err));
	}
};
