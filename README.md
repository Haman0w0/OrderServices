# OrderServices
執行環境: Google Apps Script<br>
需要的東西: Line Messaging API、Google 試算表<br>
# 使用方式
1.在<a href = "https://developers.line.biz/zh-hant/">LINE Developers</a>裡建立一個Messaging API<br>
2.把Messaging API設定好，不會可以上網搜尋<br>
3.把Messaging API的TOKEN貼到services.js裡的CHANNEL_ACCESS_TOKEN<br>
4.把OrderServicesData.xlsx上傳到Google雲端硬碟裡<br>
5.取得在Google雲端硬碟中OrderServicesData.xlsx的共用連結，要允許編輯<br>
6.把共用連結貼到services.js裡的sheet_url<br>
7.在Google雲端硬碟裡新建立一個Google Apps Script<br>
8.把services.js的程式碼貼到剛剛建的Google Apps Script<br>
9.部屬成網頁應用程式<br>
10.把部屬完的連結貼到Messaging API裡的Webhook URL<br>
11.把LINE Messaging API帳號加到想使用的地方<br>
12.完成<br>
# OrderServicesData.xlsx介紹
OrderServicesData.xlsx裡的data1是拿來存有執行到的聊天紀錄，而orderdata是拿來存大家點了什麼，最後的restaurant是來存餐廳名稱與菜單圖片，需要放入圖片連結，否則可能會出錯
# 指令介紹
1.@[菜單名稱]<br>
點餐程式啟動，菜單名稱為restaurant裡的名稱，ex: @餐廳1<br>
2.@目前<br>
查看目前點餐人資訊<br>
3.@明細<br>
查看餐點數量<br>
4.@結算<br>
點餐程式關閉<br>
5.@查詢[菜單名稱]<br>
查看所查詢的菜單圖片，並沒有讓點餐程式啟動，ex: @查詢餐廳1<br>
6.[點餐名稱]+[數字]<br>
點餐，ex: 雞排+5<br>
7.[點餐名稱]-[數字]<br>
餐點取消，ex: 雞排-5<br>
# 注意事項<br>
1.點餐程式啟動後，需要做@結算才可以讓程式回到初始狀態，沒做@結算時無法再次讓點餐程式啟動<br>
2.當點餐想取消時，需要減相同數量，ex: 一開始雞排+1，後來取消時雞排-1<br>
3.OrderServicesData.xlsx裡的restaurant，需要放入圖片連結，否則可能會出錯<br>
