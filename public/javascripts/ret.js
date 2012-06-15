window.onload = function () {
    var container = document.getElementById("expenseGraphContainer");

    var data = [];
    data[0] = [[0, 45]];

    data[1] = [[1, 32]];

    data[2] = [[2, 63]];

    var options = {
        bars: {
            show: true,
            horizontal: false,
            barWidth:.5
        },

        xaxis: {
            //showLabels: false,
            tickFormatter: formatXAxis
        },

        yaxis: {
            min: 0
        },

        title: "Expenses Paid"
    };


// Draw the graph:
    try {
        var graph = Flotr.draw(container, data, options);
    } catch (err) {
        console.log(err);
    }
};

function formatXAxis (x) {
    var names = ['Aaron', 'Andy', 'Barry'];
    var index = parseFloat(x);

    console.log(index);

    if (index % 1 === 0) {
        return names[index];
    } else {
        return '';
    }
}
