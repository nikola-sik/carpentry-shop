

const increaseQuantity = (btn, itemId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let quantityElement = document.getElementById("quantity_" + itemId);
  let totalPriceElement = document.getElementById("totalPrice");
  fetch('/user/increase-quantity/', {
    method: 'POST',
    headers: {

      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "itemId=" + itemId
  })
    .then(result => {

      return result.json();
    })
    .then(data => {
      if (data.msg === "successful") {
        quantityElement.innerHTML = "Količina: " + data.quantity;
        totalPriceElement.innerHTML = "Ukupna cijena: " + data.totalPrice + " KM";
      }
    })
    .catch(err => {
      console.log(err);
    });

};


const decreaseQuantity = (btn, itemId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let quantityElement = document.getElementById("quantity_" + itemId);
  let totalPriceElement = document.getElementById("totalPrice");

  fetch('/user/decrease-quantity/', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "itemId=" + itemId
  })
    .then(result => {

      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        quantityElement.innerHTML = "Količina: " + data.quantity;
        totalPriceElement.innerHTML = "Ukupna cijena: " + data.totalPrice + " KM";
      }
    })
    .catch(err => {
      console.log(err);
    });

};




const deleteOrderItem = (btn, itemId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let orderItemElement = document.getElementById("item_" + itemId);
  let totalPriceElement = document.getElementById("totalPrice");

  fetch('/user/delete-order-item', {
    method: 'POST',
    headers: {
      'csrf-token': csrf,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "itemId=" + itemId
  })
    .then(result => {

      return result.json();
    })
    .then(data => {

      if (data.msg === "successful") {
        orderItemElement.parentNode.removeChild(orderItemElement);
        totalPriceElement.innerHTML = "Ukupna cijena: " + data.totalPrice;
        if (data.emptyOrder == true) {
          document.getElementById("print_no_items").hidden = false;
          document.getElementById("item_form").hidden = true;
        }
      }
    })
    .catch(err => {

      console.log(err);
    });

};


const deleteMessage = (btn, messageId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  let messageElement = document.getElementById("message_" + messageId);

  fetch('/user/delete-message', {
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



const changeToReaded = (btn, messageId) => {
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
  let messageElement = document.getElementById("user_messages");
  let messageElementMobile = document.getElementById("user_messages_mobile");

  let numberOfMessages;
  fetch('/user/update-to-readed', {
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
