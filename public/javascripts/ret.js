$(document).ready(function() {
    $('#expensesOverview').click(function (e) {console.log('switch to overview');
        e.preventDefault();
        $(this).tab('show');
    });

    $('#pastExpenses').click(function (e) {console.log('switch to expenses');
        e.preventDefault();
        $(this).tab('show');
    });

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
        }
    };

    var graph = Flotr.draw(container, data, options);
});

function formatXAxis (x) {
    var names = ['Aaron', 'Andy', 'Barry'];
    var index = parseFloat(x);

    if (index % 1 === 0) {
        return names[index];
    } else {
        return '';
    }
}
