
const deleteMessage = (btn, messageId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  let messageElement = document.getElementById("message_" + messageId);

  fetch('/admin/delete-message', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "messageId=" + messageId
  })
    .then(result => {
      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        messageElement.parentNode.removeChild(messageElement);
      }
    })
    .catch(err => {
      console.log(err);
    });

};


const deleteAllMessagesOfUser = (btn, username) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let messageElement = document.getElementById("admin_messages");
  let messageElementMobile = document.getElementById("admin_messages_mobile");

  let messageUserElement = document.getElementById("messages_" + username);
  let changedRows;
  let numberOfMessages;
  fetch('/admin/delete-all-user-messages', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "username=" + username
  })
    .then(result => {

      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        numberOfDeleted = data.changedRows;
        messageUserElement.parentNode.removeChild(messageUserElement);

        numberOfMessages = messageElement.innerHTML.split(' ')[1];
        if (numberOfMessages) {
          numberOfMessages = parseInt(numberOfMessages);
          if (numberOfMessages > numberOfDeleted) {
            numberOfMessages -= numberOfDeleted;
            messageElement.innerHTML = 'Poruke ' + numberOfMessages;
          } else if (numberOfMessages <= numberOfDeleted) {
            messageElement.innerHTML = 'Poruke';
            messageElement.style.color = '#ffeb3b';
          }
        }

        if (messageElementMobile) {

          numberOfMessages = messageElementMobile.innerHTML.split(' ')[1];
          if (numberOfMessages) {
            numberOfMessages = parseInt(numberOfMessages);
            if (numberOfMessages > numberOfDeleted) {
              numberOfMessages -= numberOfDeleted;
              messageElementMobile.innerHTML = 'Poruke ' + numberOfMessages;
            } else if (numberOfMessages <= numberOfDeleted) {
              messageElementMobile.innerHTML = 'Poruke';
              messageElementMobile.style.color = '#ffffff';
            }
          }
        }


      }
    })
    .catch(err => {
      console.log(err);
    });

};



const changeToReaded = (btn, messageId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let messageElement = document.getElementById("admin_messages");
  let messageElementMobile = document.getElementById("admin_messages_mobile");

  let numberOfMessages;
  fetch('/admin/update-to-readed', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "messageId=" + messageId
  })
    .then(result => {

      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        btn.parentNode.removeChild(btn);

        if (messageElement) {

          numberOfMessages = messageElement.innerHTML.split(' ')[1];
          if (numberOfMessages) {
            numberOfMessages = parseInt(numberOfMessages);
            if (numberOfMessages > 1) {
              numberOfMessages--;
              messageElement.innerHTML = 'Poruke ' + numberOfMessages;
            } else if (numberOfMessages <= 1) {
              messageElement.innerHTML = 'Poruke';
              messageElement.style.color = '#ffeb3b';
            }
          }
        }
        if (messageElementMobile) {
          numberOfMessages = messageElementMobile.innerHTML.split(' ')[1];
          if (numberOfMessages) {
            numberOfMessages = parseInt(numberOfMessages);
            if (numberOfMessages > 1) {
              numberOfMessages--;
              messageElementMobile.innerHTML = 'Poruke ' + numberOfMessages;
            } else if (numberOfMessages <= 1) {
              messageElementMobile.innerHTML = 'Poruke';
              messageElementMobile.style.color = '#ffffff';
            }
          }
        }
      }
    })
    .catch(err => {
      console.log(err);
    });

};


const deleteUser = (btn, userId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let userElement = document.getElementById("user_" + userId);
  let i = btn.parentNode.parentNode.rowIndex;
  fetch('/admin/delete-user', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "userId=" + userId
  })
    .then(result => {

      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        document.getElementById("table_of_users").deleteRow(i);
      }
    })
    .catch(err => {
      console.log(err);
    });

};


const changeUserActive = (btn, userId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;


  let btnElement = document.getElementById("btn_checkbox_" + userId);
  let status = btnElement.className.split('_')[1];
  let i = btn.parentNode.parentNode.rowIndex;
  fetch('/admin/change-user-status', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "userId=" + userId + "&status=" + status
  })
    .then(result => {

      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        if (status == 'active')
          btnElement.className = "checkbox_empty";
        else
          btnElement.className = "checkbox_active";
      }
    })
    .catch(err => {
      console.log(err);
    });

};


const deleteProcurementItem = (btn, itemId, procurementId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let itemElement = document.getElementById("item_" + itemId);
  fetch('/admin/delete-procurement-item', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "itemId=" + itemId + "&procurementId=" + procurementId
  })
    .then(result => {

      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        itemElement.parentNode.removeChild(itemElement);
        if (data.emptyProcurement == true) {
          document.getElementById("print_no_items").hidden = false;
          document.getElementById("items_form").hidden = true;
        }
      }
    })
    .catch(err => {
      console.log(err);
    });

};

