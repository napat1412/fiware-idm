const models = require('../../models/models.js');
// Obtain secret from config file
const config = require('../../config.js');
const crypto = require('crypto');

const debug = require('debug')('idm:web-credential_controller');

// POST /idm/applications/:application_id/credential/register -- Register Credential
exports.register_credential = function(req, res) {
  debug('--> register_credential');
  
  const access_token = crypto.randomBytes(20).toString('hex');
  const id = 'credential_' + crypto.randomBytes(20).toString('hex');
  const expires = new Date( new Date().getTime() + config.credential.expires );
  const role = req.body.user;    // POST method
  //const role = req.query.user; // GET method
  

  const credential = models.oauth_access_token.build({
    access_token,
    expires,
    scope: 'credential',
    valid: 1,
    oauth_client_id: req.application.id,
    user_id: role,
    refresh_token: id,
  });

  credential
    .save({
      fields: ['access_token', 'expires', 'scope', 'refresh_token', 'valid', 'oauth_client_id', 'user_id'],
    })
    .then(function() {      
      // Send message of success in create a credential
      const response = {
        message: { text: ' Create Credential.', type: 'success' },
        credential: { id, access_token, expires, role },
      };
      // Send response depends on the type of request
      send_response(
        req,
        res,
        response,
        '/idm/applications/' + req.application.id
      );
    })
    .catch(function(error) {
      debug('Error: ', error);

      // Send message of fail when create a credential
      const response = { text: ' Failed create Credential.', type: 'warning' };

      // Send response depends on the type of request
      send_response(
        req,
        res,
        response,
        '/idm/applications/' + req.application.id
      );
    });
};

// DELETE /idm/applications/:application_id/credential/:credential_id/delete -- Delete Credential
exports.delete_credential = function(req, res) {
  debug('--> delete_credential');
  
  // Destroy credential form table
  models.oauth_access_token
    .destroy({
      where: {
        //refresh_token: 'credential_87768c230bf73147698086a06c93c8b5b90bb21e',
        refresh_token: req.params.credential_id,
        oauth_client_id: req.application.id,
      },
    })
    .then(function(deleted) {
      let response;

      if (deleted) {
        // Send message of success of deleting credential
        response = {
          text: ' Credential was successfully deleted.',
          type: 'success',
        };
      } else {
        // Send message of fail when deleting credential
        response = { text: ' Failed deleting credential', type: 'danger' };
      }

      // Send response depends on the type of request
      send_response(
        req,
        res,
        response,
        '/idm/applications/' + req.application.id
      );
    })
    .catch(function(error) {
      debug('Error: ', error);

      // Send message of fail when delete a credential
      const response = { text: ' Failed create credential.', type: 'warning' };

      // Send response depends on the type of request
      send_response(
        req,
        res,
        response,
        '/idm/applications/' + req.application.id
      );
    });
};

// Funtion to see if request is via AJAX or Browser and depending on this, send a request
function send_response(req, res, response, url) {
  if (req.xhr) {
    res.send(response);
  } else {
    if (response.message) {
      req.session.message = response.message;
    } else {
      req.session.message = response;
    }
    res.redirect(url);
  }
}
