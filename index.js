const fetch = require('cross-fetch')
const axios = require('axios')
const { TelegramClient } = require('messaging-api-telegram')
const username = 'duc.phan'
const password = '12345678'

// get accessToken from telegram [@BotFather](https://telegram.me/BotFather)
const client = TelegramClient.connect('972402414:AAE5rvRgp3oanR7tRm7mO2YESRrpE4bya-Q')


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
      "access-token": ""
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
      "access-token": tokenD
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
      .then(async res => {
        let { dishes } = res.data.menuPublishBySite
	let duPhong = dishes[0]
        let monKhongUas = await axios.get("https://github.com/phanduchupdkh/lenhDatComTrua/blob/master/monkhonguathich.txt")
	monKhongUas = monKhongUas.data.split('trunhungmonnayra:')[1].split(/,\s?/)
        let dish;
        monKhongUas.forEach(monKhongUa => {
          dishes = dishes.filter(item => !(item.name.toLowerCase().includes(monKhongUa)))
        })

	const lenDish = dishes.length
	//console.log(dishes.map(item=>item.name))
        lenDish?(dish = dishes[parseInt(lenDish*Math.random())]):(dish = duPhong)
	
        let { _id } = res.data.menuPublishBySite
        return { dish, _id }
      })
      .then(({ dish, _id }) => {
        // check should order
	//console.log(dish.name)
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

              // console.log('bạn đã đặt rồi :', res.data.ordersByUser)
	      let idConfirm = res.data.ordersByUser[0]._id
		if(res.data.ordersByUser[0].isConfirmed===false){
             		 fetch("https://portal.acexis.com/graphqllunch", {
                	"credentials": "omit",
                	"headers": header,
                	"referrer": "https://portal.acexis.com/lun/order",
                	"referrerPolicy": "no-referrer-when-downgrade",
               	 	"body": `{\"operationName\":\"updateOrder\",\"variables\":{\"id\":\"${idConfirm}\",\"input\":{\"isConfirmed\":true}},\"query\":\"mutation updateOrder($id: String!, $input: UpdateOrderInputC!) {\\n  updateOrder(id: $id, input: $input)\\n}\\n\"}`,
                	"method": "POST",
               	 	"mode": "cors"
              		})
              		.then(()=>{
				client.sendMessage(-339081841, `@phanduchupdkh ban da confirm thanh cong`).then(() => {
                    		console.log('sent');
                  		});
			})
		}
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
                  client.sendMessage(-339081841, `@phanduchupdkh ban da dat mon: ${dish.name} thanh cong `).then(() => {
                    console.log('sent');
                  });

                })
            }
          })
      })
      .catch(err => {
        console.log(err)
      })

  })


// Ham huy 
// fetch("https://portal.acexis.com/graphqllunch", {
//   "credentials": "omit",
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9",
//     "content-type": "application/json",
//     "currentsite": "52be5550-be4f-11e9-aa89-2b0626c97f03",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "token": "erQaAqcaD_XCMcBQRnfT3OW18"
//   },
//   "referrer": "https://portal.acexis.com/lun/order",
//   "referrerPolicy": "no-referrer-when-downgrade",
//   "body": "{\"operationName\":\"orderDishC\",\"variables\":{\"input\":{\"menuId\":\"b61d9d32-172e-11ea-9545-9ff408c0ec7e\",\"dishId\":\"e87b2360-172e-11ea-9545-9ff408c0ec7e\",\"order\":false}},\"query\":\"mutation orderDishC($input: CreateOrderInputC!) {\\n  orderDishC(input: $input)\\n}\\n\"}",
//   "method": "POST", "mode": "cors"
// });
