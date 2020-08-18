// Handle authorize users to the application
$(document).ready(function() {
  var url =
    '/idm/applications/' +
    window.location.pathname.split('/')[3] +
    '/authorized_users';
  load_users(url);

  // Load authorize users to used as User-Role in credential
  function load_users(url, panel) {
    $.get(url, function(data, status) {
      if (data.users.length > 0) {
        for (var i = 0; i < data.users.length; i++) {          
          $('#collapse_credentials')
            .find('select#selected_user')
            .append("<option value='"+data.users[i].id+"'>"+data.users[i].username+"</option>");
        }
      }
    });
  }
  
  // Assign credential to application
  $("#register_credential").submit(function(event) {
    event.preventDefault(); // avoid to execute the actual submit of the form.
    
    var url = $(this).attr('action');    
    var application_id = String(url.split('/')[3]);
    var user = $('#selected_user').val();
    
    if (user !== "") {
      $('#collapse_credentials')
        .find('.alert')
        .hide();
      $('#collapse_credentials')
        .find('#credential_content')
        .find('#register_credential')
        .removeClass('dropdown-empty');
      $.ajax({
        type: 'POST',
        url,
        data: { user },
        beforeSend: before_send($('input:hidden[name=_csrf]').val()),
        success: function(result) {
          //if (result.credential && result.message.type === 'success') {
          if (result.message.type === 'success') {
            $('#collapse_credentials')
              .find('.show_credential')
              .remove();
            var credential = $('#credential_template').html();
            credential = credential.replace(/credential_id/g, result.credential.id);
            credential = credential.replace(/credential_role/g, result.credential.role);
            //credential = credential.replace(/credential_expires/g, result.credential.expires);
            credential = credential.replace(/credential_token/g, result.credential.access_token);
            credential = credential.replace(/application_id/g, application_id);
            
            $('#collapse_credentials')
              .find('#credential_content')
              .prev()
              .before(credential);

            // Add message
            create_message(result.message.type, result.message.text);
          } else {
            // Add message
            create_message(result.type, result.text);
          }
        }
      });
    }
    else {
      $('#collapse_credentials')
        .find('.alert')
        .show();
      $('#collapse_credentials')
        .find('#credential_content')
        .find('#register_credential')
        .addClass('dropdown-empty');
    }
  });
  
  // Delete Credential
  $('#collapse_credentials').on('click', '.delete_credential', function(event) {
    // Stop linking
    event.preventDefault();

    // Row of credential clicked
    var row = $(this).closest('.content_credential');

    // Send ajax request to delete credential
    var url = $(this).attr('href');

    $.ajax({
      url: url,
      type: 'DELETE',
      data: { credential : "hello"},
      beforeSend: before_send($('input:hidden[name=_csrf]').val()),
      success: function(result) {
        if (result.type === 'success') {
          $('#collapse_credentials')
            .find('.show_credential')
            .remove();
          row.remove();
        }

        // Add message
        create_message(result.type, result.text);
      },
    });
  });
  
});

// Function to create messages
function create_message(type, text) {
  var message = $('#message_template').html();
  message = message.replace(/type/g, type);
  message = message.replace(/data/g, text);
  $('.messages').replaceWith(message);
}
