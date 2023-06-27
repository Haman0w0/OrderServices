const CHANNEL_ACCESS_TOKEN = ""; //line bot token

const sheet_url = ''; //google試算表網址
var sheet_name = 'data1';
const SpreadSheet = SpreadsheetApp.openByUrl(sheet_url);
var reserve_list = SpreadSheet.getSheetByName(sheet_name);

// 必要參數宣告
var current_time = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd-HH:mm:ss"); // 取得執行時的當下時間
var current_list_row = reserve_list.getLastRow(); // 取得工作表最後一欄（ 直欄數 ）
var reply_message = []; // 空白回覆訊息陣列，後期會加入 JSON

function doPost(e) {
  var msg = JSON.parse(e.postData.contents);
  const replyToken = msg.events[0].replyToken;
  const user_id = msg.events[0].source.userId;
  const userMessage = msg.events[0].message.text;
  const event_type = msg.events[0].source.type; 
  const groupid = msg.events[0].source.groupId;
  var user_name = get_user_name(event_type,user_id,groupid);

  if (typeof replyToken === 'undefined') {
    return;
  };

  if(userMessage.includes("@查詢")){
    savedata(user_name,userMessage);
    let restaurantName = userMessage.substring(userMessage.indexOf("@查詢")+3);
    showMenu(restaurantName,user_name);
    send_to_line(replyToken,reply_message);
  }else if(userMessage.includes("@明細")){
    savedata(user_name,userMessage);
    orderDetails(replyToken);
  }else if(userMessage.includes("@分食")){
    savedata(user_name,userMessage);
    orderMenu();
    send_to_line(replyToken,reply_message);
  }else{
    if(order()){
      if(userMessage.includes("@結算")){ //點餐結束
        savedata(user_name,userMessage);
        restaurantSet("","",false);
        orderSum(true);
        send_to_line(replyToken,reply_message);
      }else if(userMessage.includes("+") && (userMessage.lastIndexOf("-") == -1)){  //購買用加的
        savedata(user_name,userMessage);
        let keyNum = userMessage.lastIndexOf("+");
        let foodName = userMessage.substring(0,keyNum).split(" ").join("");
        let foodNum = parseInt(userMessage.substring(keyNum + 1));
        if((foodNum.toString() != "NaN")&&(foodName != "")){
          orderWrite(foodName,foodNum,user_name,replyToken);
        }else{
          reply_message = format_text_message(user_name+" 錯誤!!");
          send_to_line(replyToken,reply_message);
        }
      }else if(userMessage.includes("-")){  //取消用減的
        savedata(user_name,userMessage);
        let keyNum = userMessage.lastIndexOf("-");
        let foodName = userMessage.substring(0,keyNum).split(" ").join("");
        let foodNum = parseInt(userMessage.substring(keyNum + 1));
        if((foodNum.toString() != "NaN")&&(foodName != "")){
          cancleOrder(foodName,foodNum,user_name,replyToken);          
        }else{
          reply_message = format_text_message(user_name+" 失敗!!");
          send_to_line(replyToken,reply_message);
        }
      }else if(userMessage.includes("@目前")){
        savedata(user_name,userMessage);
        orderSum(false);
        send_to_line(replyToken,reply_message);
      }
    }else{
      if(userMessage.includes("@")){ //點菜啟動
        let restaurantName = userMessage.substring(userMessage.indexOf("@")+1);
        if(selectRestaurant(restaurantName)){
          savedata(user_name,userMessage);
          restaurantSet(restaurantName,user_name,true);
          showMenu(restaurantName,user_name);
          send_to_line(replyToken,reply_message);
        }
      }
    }    
  }
}

//儲存點餐原始data
function savedata(user_name,userMessage){
  reserve_list.getRange(current_list_row + 1, 1).setValue(current_time);
  reserve_list.getRange(current_list_row + 1, 2).setValue(user_name);
  reserve_list.getRange(current_list_row + 1, 3).setValue(userMessage);
}

//訂單取消
function cancleOrder(foodName,foodNum,userName,replyToken){
  var reserve_list1=SpreadSheet.getSheetByName("orderdata");
  var current_list_row1=reserve_list1.getLastRow();
  var nowNum = reserve_list1.getRange(1,8).getValue();
  for(var i = current_list_row1;i>2;i--){
    if((reserve_list1.getRange(i,1).getValue()) != nowNum){
      reply_message=format_text_message(userName+" 取消失敗");
      send_to_line(replyToken,reply_message);
      break;
    }
    if((userName == reserve_list1.getRange(i,5).getValue()) && (!(reserve_list1.getRange(i,8).getValue()))){
      if(foodName == reserve_list1.getRange(i,6).getValue()){
        if(foodNum == reserve_list1.getRange(i,7).getValue()){
          reserve_list1.getRange(i,8).setValue("true");
          reserve_list1.getRange(i,9).setValue("true");
          reply_message=format_text_message(userName+" 取消成功");
          send_to_line(replyToken,reply_message);
          break;
        }
      }
    }
  }
}

//分食資料
function orderMenu(){
  var reserve_list1=SpreadSheet.getSheetByName("orderdata");
  var current_list_row1=reserve_list1.getLastRow();
  var nowNum = reserve_list1.getRange(1,8).getValue();
  var replayM = "";
  for(var i= current_list_row1; i > 2; i--){
    if((reserve_list1.getRange(i,1).getValue() != nowNum)){
      break;
    }

    if(!(reserve_list1.getRange(i,8).getValue())){
      replayM = replayM + reserve_list1.getRange(i,5).getValue()+" "+reserve_list1.getRange(i,6).getValue()+" "+reserve_list1.getRange(i,7).getValue()+"份\n" ;
    }    
  }
  replayM = replayM.substring(0,replayM.lastIndexOf('\n'));
  reply_message = format_text_message(reserve_list1.getRange(1,10).getValue() + "\n" + "訂單：\n" +replayM);
}

//訂單明細
function orderDetails(replyToken){ 
  var reserve_list1=SpreadSheet.getSheetByName("orderdata");
  var current_list_row1=reserve_list1.getLastRow();
  var num = reserve_list1.getRange(1,8).getValue();
  for(let i = current_list_row1; i > 2; i--){ //是否統計欄位重設
    if(reserve_list1.getRange(i,1).getValue() != num){
      break;
    }
    if(!(reserve_list1.getRange(i,8).getValue())){
      reserve_list1.getRange(i,9).setValue("false");
    }
  }


  var foodName = "";
  var count = 0;

  var replayM = "明細：\n";
  for(let i = current_list_row1; i > 2; i--){
    if(reserve_list1.getRange(i,1).getValue() != num){
      break;
    }
    foodName = "";
    count = 0;
    if(!(reserve_list1.getRange(i,9).getValue())&&!(reserve_list1.getRange(i,8).getValue())){
      foodName = reserve_list1.getRange(i,6).getValue();
      reserve_list1.getRange(i,9).setValue("true");
      count = count + reserve_list1.getRange(i,7).getValue();

      for(let j = i-1; j>2; j--){
        if(reserve_list1.getRange(j,1).getValue() != num){
          break;
        }
        if(!(reserve_list1.getRange(j,9).getValue())&&!(reserve_list1.getRange(i,8).getValue())&&(reserve_list1.getRange(j,6).getValue() == foodName)){
          reserve_list1.getRange(j,9).setValue("true");
          count = count + reserve_list1.getRange(j,7).getValue();
        }
      }
    }
    if(count > 0){
      replayM = replayM + foodName + " " + count + "份\n";
    }
  }
  if(replayM != "明細：\n"){
    replayM = replayM.substring(0,replayM.lastIndexOf('\n'));
    reply_message = format_text_message(reserve_list1.getRange(1,10).getValue() + "\n" + replayM);
    send_to_line(replyToken,reply_message);
  }
}

//查詢餐廳是否存在
function selectRestaurant(restaurantName){
  var reserve_list1=SpreadSheet.getSheetByName("restaurant");
  reserve_list1.getRange(1,1).setValue(restaurantName);
  return reserve_list1.getRange(1,2).getValue();
}

//顯示菜單
function showMenu(restaurantName,user_name){
  var reserve_list1=SpreadSheet.getSheetByName("restaurant");
  reserve_list1.getRange(1,1).setValue(restaurantName);
  if(reserve_list1.getRange(1,2).getValue()){
    let Ppicturelink = reserve_list1.getRange(1,4).getValue().toString().split(';');
    let Opicturelink = reserve_list1.getRange(1,3).getValue().toString().split(';');
    reply_message = format_image_message(Opicturelink,Ppicturelink,Opicturelink.length);
  }else{
    reply_message = format_text_message(user_name+" 查無資料!");
  }
}

//點餐資料寫入
function orderWrite(foodName,foodNum,user_name,replyToken){
  var reserve_list1=SpreadSheet.getSheetByName("orderdata");
  var current_list_row1=reserve_list1.getLastRow();
  var orderStartName = reserve_list1.getRange(1,4).getValue();
  var restaurantName = reserve_list1.getRange(1,6).getValue();
  var num = reserve_list1.getRange(1,8).getValue();

  reserve_list1.getRange(current_list_row1 + 1,1).setValue(num);
  reserve_list1.getRange(current_list_row1 + 1,2).setValue(orderStartName);
  reserve_list1.getRange(current_list_row1 + 1,3).setValue(restaurantName);
  reserve_list1.getRange(current_list_row1 + 1,4).setValue(current_time);
  reserve_list1.getRange(current_list_row1 + 1,5).setValue(user_name);
  reserve_list1.getRange(current_list_row1 + 1,6).setValue(foodName);
  reserve_list1.getRange(current_list_row1 + 1,7).setValue(foodNum);
  reserve_list1.getRange(current_list_row1 + 1,8).setValue("false");
  reserve_list1.getRange(current_list_row1 + 1,9).setValue("false");
}

//結算
function orderSum(end){
  var reserve_list1=SpreadSheet.getSheetByName("orderdata");
  var current_list_row1=reserve_list1.getLastRow();
  var nowNum = reserve_list1.getRange(1,8).getValue();

  var replayM = "";
  if(end){
    replayM = "結算：\n"
  }else{
    replayM = "目前：\n";
  }
  for(var i= current_list_row1; i > 2; i--){
    if(reserve_list1.getRange(i,1).getValue() != nowNum){
      break;
    }

    if(!(reserve_list1.getRange(i,8).getValue())){
      replayM = replayM + reserve_list1.getRange(i,5).getValue()+" "+reserve_list1.getRange(i,6).getValue()+" "+reserve_list1.getRange(i,7).getValue()+"份\n";
    }
  }
  replayM = replayM.substring(0,replayM.lastIndexOf('\n'));
  reply_message = format_text_message(reserve_list1.getRange(1,10).getValue() + "\n" + replayM);
}

//查詢是否開始點餐
function order(){
  var reserve_list1=SpreadSheet.getSheetByName("orderdata");
  //var current_list_row1=reserve_list1.getLastRow();
  return reserve_list1.getRange(1,2).getValue();
}

//點餐狀態設定
function restaurantSet(restaurant,user_name,control){
  var reserve_list1=SpreadSheet.getSheetByName("orderdata");
  if(control){
    reserve_list1.getRange(1,2).setValue("true");
    reserve_list1.getRange(1,4).setValue(user_name);
    reserve_list1.getRange(1,6).setValue(restaurant);
    var num = reserve_list1.getRange(1,8).getValue() + 1;
    reserve_list1.getRange(1,8).setValue(num);
    reserve_list1.getRange(1,10).setValue(Utilities.formatDate(new Date(), "Asia/Taipei", "MM/dd - HH:mm"));
  }else{
    reserve_list1.getRange(1,2).setValue("false");
    reserve_list1.getRange(1,4).setValue("");
    reserve_list1.getRange(1,6).setValue("");
  }
}

// 將輸入值 word 轉為 LINE 文字訊息格式之 JSON
function format_text_message(word) {
  let text_json = [{
    "type": "text",
    "text": word
  }];
  return text_json;
}

//將圖片連結轉換為 LINE 圖片訊息格式之 JSON
function format_image_message(Opicturelink,Ppicturelink,count) {
  var isFirst = true;
  var text_json;
  for(var i = 0;i<count;i++){
    if(isFirst){
      text_json = [{
        "type" : "image",
        "originalContentUrl" : Opicturelink[i],
        "previewImageUrl" : Ppicturelink[i]
      }];
      isFirst = false;
    }else{
      text_json = text_json.concat([{
        "type" : "image",
        "originalContentUrl" : Opicturelink[i],
        "previewImageUrl" : Ppicturelink[i]
      }]);
    }
  }
  return text_json;
}

// 回傳訊息給line 並傳送給使用者
function send_to_line(replyToken, reply_message) {
  var url = 'https://api.line.me/v2/bot/message/reply';
  UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': reply_message,
    }),
  });
}


// 查詢傳訊者的 LINE 帳號名稱
function get_user_name(event_type,user_id,groupid) {
  // 判斷為群組成員還是單一使用者
  switch (event_type) {
    case "user":
      var nameurl = "https://api.line.me/v2/bot/profile/" + user_id;
      break;
    case "group":
      var nameurl = "https://api.line.me/v2/bot/group/" + groupid + "/member/" + user_id;
      break;
  }
  try {
  //  呼叫 LINE User Info API，以 user ID 取得該帳號的使用者名稱
    var response = UrlFetchApp.fetch(nameurl, {
      "method": "GET",
      "headers": {
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN,
        "Content-Type": "application/json"
      },
    });
    var namedata = JSON.parse(response);
    var user_name = namedata.displayName;
  }
  catch {
    user_name = "not avaliable";
  }
  return String(user_name);
}
