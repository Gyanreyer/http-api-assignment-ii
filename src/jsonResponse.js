const crypto = require('crypto');

const users = {};

let etag = crypto.createHash('sha1').update(JSON.stringify(users));
let digest = etag.digest('hex');

const respondJSON = (request, response, status, json) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.write(JSON.stringify(json));
  response.end();
};

const respondJSONMeta = (request, response, status) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.end();
};

const getUsers = (request, response) => {
  if (request.headers['if-none-match'] === digest) {
    return respondJSONMeta(request, response, 304);
  }

  const responseJSON = {
    users,
  };

  return respondJSON(request, response, 200, responseJSON);
};

const getUsersMeta = (request, response) => {
  const responseCode = request.headers['if-none-match'] === digest ? 304 : 200;

  respondJSONMeta(request, response, responseCode);
};

const addUser = (request, response, body) => {
  const responseJSON = {
    message: 'Name and age required.',
  };

  if (!body.name || !body.age) {
    responseJSON.id = 'missingParams';
    return respondJSON(request, response, 400, responseJSON);
  }

  let responseCode = 201;

  if (users[body.name]) {
    responseCode = 204;
  } else {
    responseJSON.message = `User ${body.name} added successfully`;
  }

  users[body.name] = body;// Store body object in users

  // Update etag w/ new users object
  etag = crypto.createHash('sha1').update(JSON.stringify(users));
  digest = etag.digest('hex');

  if (responseCode === 201) {
    return respondJSON(request, response, responseCode, responseJSON);
  }
  return respondJSONMeta(request, response, responseCode);
};

const respondNotReal = (request, response) => {
  const responseJSON = {
    message: 'Error: not found',
    id: 'notReal',
  };

  respondJSON(request, response, 404, responseJSON);
};

const respondNotRealMeta = (request, response) => {
  respondJSONMeta(request, response, 404);
};

module.exports = {
  getUsers,
  getUsersMeta,
  addUser,
  respondNotReal,
  respondNotRealMeta,
};
