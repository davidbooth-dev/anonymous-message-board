const DAYS = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
]

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

function format(value) {
    return value <= 9 ? '0' + value : value;
}

function formatDay(value) {
    var result = "";
    var suffix = "th";

    value = value.toString();

    if ((value >= 4 && value <= 20) || (value >= 24 && value <= 30)) suffix = "th";
    else {
        if (value.indexOf("1") != -1) suffix = "st";
        else if (value.indexOf("2") != -1) suffix = "nd";
        else if (value.indexOf("3") != -1) suffix = "rd";
    }

    return value + suffix;
}
// helper function
function getDateString(date) {
    let d = new Date(date);
    let result = DAYS[d.getDay()] + ", " +
        formatDay(d.getDate()) + " " +
        MONTHS[d.getMonth()] + ", " +
        d.getFullYear() + '@' +
        format(d.getHours()) + ':' +
        format(d.getMinutes()) + ':' +
        format(d.getSeconds());
    return result;
}
/*
    Returns a formatted datestring for client
    e.g. Tue, 2nd Aug 2022
*/
exports.getDate = (date) => {
    let result = getDateString(date);

    return result;
}