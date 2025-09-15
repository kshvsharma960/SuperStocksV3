function GetGameType() {
    var type = $("#mainGrid").attr("data-value");
    let gameType = "";
    switch (type) {
        case "Competition":
            gameType = "C1";
            break;
    }
    return gameType;
}

function GetHoldingsGrid() {
    var cols = [
        { title:"Stocks", name: "Name", type: "text", width: 20 },
        { title: "Quant.", name:"Count", type: "number", width: 20 },
        { title: "Avg", name: "AveragePrice", type: "number", width: 20 },
        { title: "LTP",name:"Price", type: "number", width: 20 },
        { title:"P/L", name: "ProfitLoss", type: "number", width: 20 }
    ];
    $.ajax({
        url: "/api/UserStocks",
        dataType: "json",
        data: {
            "GameType": GetGameType()
        },
        contentType:"application/json",
        success: function (Data) {
            var listData = JSON.parse(Data).Value.UserStockList;
            if (listData != null && listData.length > 0) {
                listData.forEach(x => {
                    x.ProfitLoss = Number((x.Price - x.AveragePrice) * x.Count).toFixed(2);
                    //if (x.ProfitLoss < 1 && x.ProfitLoss > -1) {
                    //    x.ProfitLoss = 0;
                    //}
                });
            }
                PopulateHoldings("grid", listData, cols, "275px");
                var json = {};
                var total = 0;
                var current = 0;
                var pnl = 0;
                listData.forEach(x => {
                    total += x.AveragePrice * x.Count;
                    current += x.Price * x.Count;
                });
                json.TotalHoldings = total.toFixed(2);
                json.CurrentValue = current.toFixed(2);
                json.ProfitLoss = (current - total).toFixed(2);
                var mycol = [
                    { title: "Total Holdings", name: "TotalHoldings", type: "number", width: 35 },
                    { title: "Current Value", name: "CurrentValue", type: "number", width: 35 },
                    { title: "P/L", name: "ProfitLoss", type: "number", width: 30 }
                ];
                var gridData = [json];

            PopulateHoldings("gridFooter", gridData, mycol, "auto");
        },
        error: function (res) {
            PopulateHoldings("Error");
        }
    });
}

function RegisterForCompetition() {
    $.ajax({
        url: "/api/Enter",
        type: "POST",
        data: JSON.stringify({ "GameType": "C1" }),
        contentType: "application/json",
        success: function (Data) {
            window.location.href = "\Home\Competition";
        },
        error: function (res) {
            alert("House Full, Please try again tomorrow.");
        }
    });
}

function GetWatchListGrid() {
    var cols = [
        { name: "Name", type: "text", width: 50 },
        { name: "Price", type: "number", width: 50 },
        {
            type: "control", modeSwitchButton: false, editButton: false
        }];
    $.ajax({
        url: "/api/UserWatchlist",
        dataType: "json",
        data: {
            "GameType": GetGameType()
        },
        contentType: "application/json",
        success: function (Data) {
            var listData = JSON.parse(Data).Value;
            var grid = "grid2";
            PopulateHoldings(grid,listData,cols);
        },
        error: function (res) {
            PopulateHoldings("Error");
        }
    });
}

function PopulateHoldings(grid,Data,cols,height) {
    if (Data != "Error") {
        if (cols == null || cols == "") {
            cols = [
                { name: "Name", type: "text", width: 40 },
                { name: "Price", type: "number", width: 30 },
                { name: "Count", type: "number", width: 30 }

                //    { name: "Address", type: "text", width: 200 },
                //    { name: "Country", type: "select", items: countries, valueField: "Id", textField: "Name" },
                //    { name: "Married", type: "checkbox", title: "Is Married", sorting: false },
                //    { type: "control" }
            ];
        }
        if (height == null || height == "") {
            height = "400px";
        }

        $("#" + grid).jsGrid({
            width: "100%",
            height: height,
            editing: false,
            sorting: true,
            paging: true,
            data: Data,
            fields: cols,
            onItemDeleting: function (args) {
                DeleteStock(args.item.Name);
            },
            rowClick: function (args) {
                GridOnClick(args);
            }
        });
    }
    else {
        $("#grid").html("Something went Wrong");
    }
}

function GetCompetitionData() {
    $.ajax({
        url: "/api/UserWatchlist",
        dataType: "json",
        data: {
            "GameType": GetGameType()
        },
        contentType: "application/json",
        success: function (Data) {
            PopulateCompetitionResult();
        },
        error: function (res) {
            console.log("Failed : GetCompetitionData");
        }
    });
}

function PopulateCompetitionResult(Data) {

    let cols = [
        { name: "Rank", type: "number", width: 30 },
        { name: "Name", type: "number", width: 30 },
        { name: "Capital", type: "number", width: 30 }
    ];
    $("#competitionResult").jsGrid({
        width: "100%",
        height: height,
        editing: false,
        sorting: false,
        paging: true,
        data: Data,
        fields: cols
    });
}

function GetUserData() {
    GetFunds();
}

function GetFunds() {
    $.ajax({
        type: "GET",
        url: "/api/GetFunds",
        data: {
            "GameType": GetGameType()
        },
        contentType: "application/json",
        success: function (args) {
//            $("#funds").html(Number(args).toFixed(2));
            $("#funds").html((args));
        },
        error: function (args) {
            alert("failed to load funds");
        }
    });
}



function GetRank() {
    $.ajax({
        type: "GET",
        url: "/api/GetRank",
        data: {
            "GameType": GetGameType()
        },
        contentType: "application/json",
        success: function (args) {
            //            $("#funds").html(Number(args).toFixed(2));
            $("#rank").html(args.split(" / ")[0]);
            $("#totalParticipants").html(args.split(" / ")[1]);
        },
        error: function (args) {
            //alert("failed to load rank");
            $("#totalParticipants").html("Network Issue");
        }
    });
}

function OnBuySell(e) {
    var type = e.id=="buyButton" ? 1:0;
    var stock = $("#mStock").html();
    var price = $("#mPrice").html();
    var quantity = $("#mQuantity").val();
    if (quantity > 0) {
        //$('#myModal').modal('toggle');
        if (type != 1) {
            quantity *= -1;
        }
        ExecuteOrder(stock, price, quantity);
    }
    else {
        alert("Please enter Quant. > 0.");
    }
}

function ExecuteOrder(stock, price, quantity) {
    var OrderData = {};
    OrderData.Stock = stock;
    OrderData.Price = price;
    OrderData.Quantity = Number(quantity);
    OrderData.GameType = GetGameType();
    $("#buyButton").prop("disabled", true);
    $("#sellButton").prop("disabled", true);

    $.ajax({
        url: "/api/ExecuteOrder",
        type: "POST",
        data: JSON.stringify(OrderData),
        contentType: "application/json",
        success: function (Data) {
            $('#myModal').modal('toggle');
            GetFunds();
        },
        error: function (res) {
            $("#buyButton").prop("disabled", false);
            $("#sellButton").prop("disabled", false);
            alert("Order Execution Fail.");
        }
    });
}

function GridOnClick(data) {
    var item = data.item;
    var Stock = item.Name;
    var Low = item.Low;
    var High = item.High;
    var Price = item.Price;
    var Open = item.Open;
    var Close = item.Close;
    $("#mHigh").html(High);
    $("#mLow").html(Low);
    $("#mLastClose").html(Close);
    $("#mOpen").html(Open);
    $("#mStock").html(Stock);
    $("#mPrice").html(Price);
    $("#buyButton").prop("disabled", false);
    $("#sellButton").prop("disabled", false);
    $('#myModal').modal('toggle');
}

function DynamicSearch() {
    var URL = "/api/AllStocks";
 
    $("#SearchStocks").select2({
        ajax: {
            url: URL,
            delay: 250,
            data: function (params) {
                var lData = {};
                lData.item = params.term;
                return lData;                
            },
            processResults: function (data, params) {
                // parse the results into the format expected by Select2
                // since we are using custom formatting functions we do not need to
                // alter the remote JSON data, except to indicate that infinite
                // scrolling can be used
                params.page = params.page || 1;

                return {
                    results: JSON.parse(data).Value
                };
            },
            cache: true
        },
        placeholder: 'Search for Equity',
        minimumInputLength: 1,
        templateResult: formatRepo,
        templateSelection: formatRepoSelection
    });
    }

function formatRepo(repo) {
   

    var $container = $(
        "<div id = '" + repo.Symbol + "'><span>" + repo.Symbol + "</span><span style='float:right' class='badge' onclick='AddStock(this)'>Add</span></div>"
    );

    return $container;
}

function DeleteStock(stock) {
    var actionData = {};
    actionData.Stock = stock;
    actionData.AddDel = 0;
    actionData.GameType = GetGameType();


    $.ajax({
        url: "/api/AddDelete",
        type: "GET",
        data: (actionData),
        contentType: "application/json",
        success: function (Data) {
            console.log("Deleted " + Data);
        },
        error: function (res) {
            alert("Deleting failed");
        }
    });
}

function AddStock(e) {
    var symbol = e.parentElement.id;
    var actionData = {};
    actionData.Stock = symbol;
    actionData.AddDel = 1;
    actionData.GameType = GetGameType();

    $.ajax({
        url: "/api/AddDelete",
        type: "GET",
        data: (actionData),        
        contentType: "application/json",
        success: function (Data) {
            GetWatchListGrid();
        },
        error: function (res) {
            alert("Adding failed");
        }
    });

}


function formatRepoSelection(repo) {
    return repo.Symbol;
}