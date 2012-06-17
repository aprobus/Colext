$(document).ready(function() {
    $('#expensesOverview').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('#pastExpenses').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
});
