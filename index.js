const fetch = require('cross-fetch')
const username = ''
const password = ''
const nodeMailer = require("nodemailer")
const smtpTransport = require("nodemailer-smtp-transport")
let transporter = nodeMailer.createTransport(
  smtpTransport({
    service: "gmail",
    auth: {
      user: "elderlycare.hcmus@gmail.com",
      pass: "doantn2019"
    }
  })
)
let mailOptions = {
  from: "elderlycare.hcmus@gmail.com",
  to: "phanduchupdkh@gmail.com",
  subject: `Đặt cơm ${new Date().toISOString()}`,
  html: ""
}

// login

fetch("https://portal.acexis.com/graphqllunch",
  {
    "credentials": "omit",
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      "currentsite": "",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "token": ""
    },
    "referrer": "https://portal.acexis.com/lun/login",
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": `{\"operationName\":null,\"variables\":{\"input\":{\"username\":\"${username}\",\"password\":\"${password}\"}},\"query\":\"mutation ($input: LoginUserInput!) {\\n  login(input: $input) {\\n    token\\n    userPermissions {\\n      siteId\\n      siteName\\n      sitepermissions\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`,
    "method": "POST",
    "mode": "cors"
  })
  .then(res => res.json())
  .then(res => {
    let tokenD = res.data.login.token
    const header = {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      "currentsite": "52be5550-be4f-11e9-aa89-2b0626c97f03",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "token": tokenD
    }

    // getMenu
    fetch("https://portal.acexis.com/graphqllunch", {
      "credentials": "omit",
      "headers": header,
      "referrer": "https://portal.acexis.com/lun/order",
      "referrerPolicy": "no-referrer-when-downgrade",
      "body": "{\"operationName\":\"menuPublishBySite\",\"variables\":{\"siteId\":\"52be5550-be4f-11e9-aa89-2b0626c97f03\"},\"query\":\"query menuPublishBySite($siteId: String!) {\\n  menuPublishBySite(siteId: $siteId) {\\n    _id\\n    name\\n    isActive\\n    isLocked\\n    isPublished\\n    dishes {\\n      _id\\n      name\\n      count\\n      orderCount\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}",
      "method": "POST",
      "mode": "cors"
    })
      .then(res => res.json())
      .then(res => {
        let { dishes } = res.data.menuPublishBySite

        const monUaThich = ['cá lóc', 'gà kho', 'canh chua']
        let dish;
        monUaThich.forEach(mon => {
          if (!dish) {
            dish = dishes.find(item => item.name.toLowerCase().includes(mon))
          }
        })
        if (!dish) { dish = dishes[0] }
        let { _id } = res.data.menuPublishBySite
        return { dish, _id }

      })
      .then(({ dish, _id }) => {
        // check should order
        fetch("https://portal.acexis.com/graphqllunch",
          {
            "credentials": "omit",
            "headers": header,
            "referrer": "https://portal.acexis.com/lun/order",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": `{\"operationName\":\"ordersByUser\",\"variables\":{\"menuId\":\"${_id}\"},\"query\":\"query ordersByUser($menuId: String!) {\\n  ordersByUser(menuId: $menuId) {\\n    _id\\n    menuId\\n    dishId\\n    count\\n    note\\n    isConfirmed\\n    __typename\\n  }\\n}\\n\"}`,
            "method": "POST",
            "mode": "cors"
          })
          .then(res => res.json())
          .then(res => {
            if (res.data.ordersByUser.length) {
              let html = `
                    <h3>Ban da dat roi<h3>
                  `
              mailOptions.html = html
              transporter.sendMail(mailOptions, function (err) {
                if (err) {
                  console.log("Sending to failed: " + err)
                } else {
                  console.log("Sent to PXD")
                  // callback()
                }
              })
              console.log('bạn đã đặt rồi :', res.data.ordersByUser)
            }
            else {
              // oder
              fetch("https://portal.acexis.com/graphqllunch",
                {
                  "credentials": "omit",
                  "headers": header,
                  "referrer": "https://portal.acexis.com/lun/order",
                  "referrerPolicy": "no-referrer-when-downgrade",
                  "body": `{\"operationName\":\"orderDishC\",\"variables\":{\"input\":{\"menuId\":\"${_id}\",\"dishId\":\"${dish._id}\",\"order\":true}},\"query\":\"mutation orderDishC($input: CreateOrderInputC!) {\\n  orderDishC(input: $input)\\n}\\n\"}`,
                  "method": "POST",
                  "mode": "cors"
                })
                .then(res => {
                  console.log(`ban da dat mon: ${dish.name} thanh cong`)
                  let html = `
                    <h3>Dat mon ${dish.name} Thanh cong<h3>
                  `
                  mailOptions.html = html
                  transporter.sendMail(mailOptions, function (err) {
                    if (err) {
                      console.log("Sending to failed: " + err)
                    } else {
                      console.log("Sent to PXD")
                      // callback()
                    }
                  })
                })
            }
          })
      })
      .catch(err => {
        console.log(err)
      })

  })


  // Ham huy 
  // fetch("https://portal.acexis.com/graphqllunch", {"credentials":"omit","headers":{"accept":"*/*","accept-language":"en-US,en;q=0.9","content-type":"application/json","currentsite":"52be5550-be4f-11e9-aa89-2b0626c97f03","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZXIiOiJodHRwOi8vbHVuY2hhcHA0LmRldi5pbyIsInN1YmplY3QiOiI3YTc3OGUwMC1jZmIwLTExZTktYjI1Ni1lNzBlZmUyNmE5ODgiLCJhdWRpZW5jZSI6Inh1YW5kdWMiLCJpYXQiOjE1NzU1MzAzMDAsImV4cCI6MTU3ODEyMjMwMH0.JwASusJLjLksXO9kHP2rQaAqcaD_XCMcBQRnfT3OW18"},"referrer":"https://portal.acexis.com/lun/order","referrerPolicy":"no-referrer-when-downgrade","body":"{\"operationName\":\"orderDishC\",\"variables\":{\"input\":{\"menuId\":\"b61d9d32-172e-11ea-9545-9ff408c0ec7e\",\"dishId\":\"e87b2360-172e-11ea-9545-9ff408c0ec7e\",\"order\":false}},\"query\":\"mutation orderDishC($input: CreateOrderInputC!) {\\n  orderDishC(input: $input)\\n}\\n\"}","method":"POST","mode":"cors"});
