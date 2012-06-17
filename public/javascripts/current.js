$(document).ready(function() {
    jQuery.getJSON('/current', function(post) {
        drawGraph(post);
    });
});


function drawGraph (people) {
    var container = document.getElementById("expenseGraphContainer");

    var expensesPerPerson = people.map(function (person, index) {
        var totalExpenses = 0.0;
        for (var i = 0; i < person.expenses.length; i++) {
            totalExpenses += person.expenses[i].amount;
        }

        return [[index, totalExpenses]];
    });

    var options = {
        bars: {
            show: true,
            horizontal: false,
            barWidth:.5
        },

        xaxis: {
            tickFormatter: formatXAxis
        },

        yaxis: {
            min: 0
        }
    };

    var graph = Flotr.draw(container, expensesPerPerson, options);

    function formatXAxis (x) {
        var index = parseFloat(x);

        if (index % 1 === 0) {
            return people[index].name;
        } else {
            return '';
        }
    }
}
