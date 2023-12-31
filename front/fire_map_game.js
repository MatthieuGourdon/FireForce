// FUNCTIONS CONFIGURATION ----------------------------------------------------------------------------------------------------

//PUT request to change the main fire configs
function put_creation_config(creationProba, creationSleep) {
    const PUT_CREATION_URL = "http://127.0.0.1:8092/config/creation";
    let context = {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
          },
        body: JSON.stringify({
            "fireCreationProbability":creationProba,
            "fireCreationSleep":creationSleep,
            "fireCreationZone":[
                {"type":"Point","coordinates":[520820,5719535]},
                {"type":"Point","coordinates":[566984,5754240]}],
            "max_INTENSITY":50.0,
            "max_RANGE":50.0
        })
    };
    fetch(PUT_CREATION_URL, context)
        .catch(error => err_callback(error));
}

//PUT request to change the configuration of fires and their child spawning rate
function put_behavior_config() {
    const PUT_BEHAVIOR_URL = "http://127.0.0.1:8092/config/behavior";
    let context = {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "propagationThreshold":5.0,
            "attenuationFactor":0.8,
            "intensityReplicationThreshold":10.0,
            "replicationProbability":0.0,
            "maxFireRange":50.0,
            "maxFireIntensity":50.0,
            "intensity_inc":0.1,
            "sleepTime":5000
        })
    };
    fetch(PUT_BEHAVIOR_URL, context)
        .catch(error => err_callback(error));
}

//Fetch parameters from client interface and call put_creation_config to tweak the fire creation parameters
function put_config() {
    creationProba = document.getElementById("creationProba").value;
    creationSleep = document.getElementById("creationSleep").value*1000;
    put_creation_config(creationProba,creationSleep);
}

//deletes all fires and unprint them from map
function reset_fire() {
    const RESET_URL = "http://127.0.0.1:8092/fire/reset";
    let context = {
        method: 'GET',
    };
    fetch(RESET_URL, context)
        .catch(error => err_callback(error));
}

// Reset all vehicle and unprint them from map
function reset_vehicle() {
    const GET_VEHICLE_URL = "http://127.0.0.1:8094/vehicle/reset";
    let context = {
        method: 'GET',
    };
    fetch(GET_VEHICLE_URL, context)
        .then(response => response.json().then(body => vehiclesList_callback_reset(body)))
        .catch(error => err_callback(error));
}

function vehiclesList_callback_reset(response) {    
    /*
    clear_vehicles();
    vehicleList = [];
    for(var i = 0; i < response.length; i++) {
        vehicleList[i] = response[i];
    }
    for(const vehicle of vehicleList) {
        delete_vehicle(vehicle.id);
    }
    */
}

function reset_station() {
    const RESET_URL = "http://127.0.0.1:8098/resetFStation";
    let context = {
        method: 'GET',
    };
    fetch(RESET_URL, context)
        .catch(error => err_callback(error));
}

function reset_all() {
    localStorage["1stStation"] = false;
    reset_station();
    reset_vehicle();
    reset_fire();
    document.location.reload();
}


// FUNCTIONS FIRE ----------------------------------------------------------------------------------------------------

//Fetch all existing fires
function fetch_fire() {
    const GET_ALL_FIRE_URL="http://127.0.0.1:8092/getAllFire"; // 8081/fire
    let context = {
        method: 'GET'
    };
    fireList = [];
    fetch(GET_ALL_FIRE_URL, context)
        .then(reponse => reponse.json().then(body => fireList_callback(body)))
        .catch(error => err_callback_fire(error));
}

function err_callback_fire() {
    clear_fire();
}

//Called when fetching fires => fill the fireList with all existing fires 
//and call fire_filter function for each fire to print them
function fireList_callback(reponse) {
    for(var i = 0; i < reponse.length; i++) {
        fireList[i] = reponse[i];
    }
    clear_fire();
    for(const fire of fireList){
        fire_filter(fire);
    }
}

//Filter fires and call the function to print only those in the range defined by the user
function fire_filter(fire) {
    if (document.getElementById(fire.type).checked == true) {
        if (fire.intensity >= document.getElementById("intensitymin").value && fire.intensity <= document.getElementById("intensitymax").value) {
            if (fire.range >= document.getElementById("rangemin").value && fire.range <= document.getElementById("rangemax").value) {
                print_fire(fire);
            }
        }
    }
}

//Print on the map the fire given in parameter
function print_fire(fire) {
    var circle = L.circle([fire.lat, fire.lon],
        {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: fire.intensity/55, // MAX_INTENSITY + 10%
            radius: fire.range
        }
    ).addTo(fireGroup);
    firePrinted.push(circle);

    var fireIcon = L.icon({
        iconUrl: 'icons/fire_map.png',    
        iconSize: [34, 34], // size of the icon
        iconAnchor: [17, 30], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    var marker = L.marker([fire.lat, fire.lon], {icon: fireIcon}).addTo(fireGroup);
    firePrinted.push(marker);
    


}

//clear all printed fires
function clear_fire() {
    for (i of firePrinted) {
        i.remove();
    }
    firePrinted = [];
}

//Fetch fetch object when clicking on a fire marker 
//and calls the fill_popup_fire function to display the corresponding fire info
function fetch_fire_fromMarker(event) {
    clickedArea = event.latlng;

    var lat_marker = event.latlng.lat;
    var lng_marker = event.latlng.lng;
    for (fire of fireList) {
        if (fire.lon == lng_marker && fire.lat == lat_marker) {
            fill_popup_fire(fire);
            return;
        }
    }
}

function fill_popup_fire(fire) {
    document.getElementById("info_fire_type").innerHTML = "Type : " + fire.type;
    document.getElementById("info_fire_intensity").innerHTML = "Intensity : " + fire.intensity;
    document.getElementById("info_fire_range").innerHTML = "Range : " + fire.range;

    document.getElementById("over_map_left").style.display = 'block';
    document.getElementById("info_fire").style.display = 'block';
    document.getElementById("over_map_left_bottom").style.display = 'none';
    document.getElementById("info_station").style.display = 'none';
}

//Updates the fire popup when it's already open
function live_fill_popup_fire(clkA) {
    var lat = clkA.lat;
    var long = clkA.lng;
    var good_fire;
    for (fire of fireList) {
        if (fire.lon == long && fire.lat == lat) {
            good_fire = fire;
            document.getElementById("info_fire_type").innerHTML = "Type : " + good_fire.type;
            document.getElementById("info_fire_intensity").innerHTML = "Intensity : " + good_fire.intensity;
            document.getElementById("info_fire_range").innerHTML = "Range : " + good_fire.range;
        }
    }
}




// FUNCTIONS VEHICLES ----------------------------------------------------------------------------------------------------

//Uses a POST request to create a vehicle given some basic parameters of the vehicle
function create_vehicle(vehicle_type, liquid_type, lon, lat, facility) {
    const POST_VEHICLE_URL = "http://127.0.0.1:8094/vehicle";  // 8081/vehicle
    let context = {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "lon":lon,
            "lat":lat,
            "type":vehicle_type,
            "efficiency":10,
            "liquidType":liquid_type,
            "liquidQuantity":1000,
            "liquidConsumption":1,
            "fuel":1,
            "fuelConsumption":1,
            "crewMember":4,
            "crewMemberCapacity":4,
            "facilityRefID":facility

        })
    };
    fetch(POST_VEHICLE_URL, context)
        .catch(error => err_callback(error));
}

//GET request to fetch all existing vehicles. Calls the vehiclesList_callback when vehicles are fetched
function fetch_vehicles() {
    const GET_VEHICLE_URL = "http://127.0.0.1:8094/getAllVehic"; // 8081/vehicle
    let context = {
        method: 'GET',
    };
    vehicleList = [];
    fetch(GET_VEHICLE_URL, context)
        .then(response => response.json().then(body => vehiclesList_callback(body)))
        .catch(error => err_callback_vehicles(error));
}

function err_callback_vehicles() {
    clear_vehicles();
}

//GET request to fetch a vehicle infos using its ID in URL parameter. Call the function to update the vehicle.
function fetch_vehicle_byId(id_vehicle, vehicle_update_callback) {
    const GET_VEHICLE_URL = "http://127.0.0.1:8094/getVehic/"+id_vehicle; // 8081/vehicle/
    let context = {
        method: 'GET',
    };
    fetch(GET_VEHICLE_URL, context)
        .then(response => response.json().then(body => vehicle_update_callback(body)))
        .catch(error => err_callback(error));
}

//Delete the vehicule corresponding to the given id in parameters 
function delete_vehicle(id_vehicle) {
    const DELETE_VEHICLE_URL = "http://127.0.0.1:8094/vehicle/"+id_vehicle; // 8081/vehicle/
    let context = {
        method: 'DELETE',
    };
    fetch(DELETE_VEHICLE_URL, context)
        .catch(error => err_callback(error));
}

//PUT request to update the vehicle infos given in parameters. 
//Then calls the fetch_vehicle_byId_visu to update vehicle info panel 
function modify_vehicle(id, remoteId, vehicle_type, fuel, fuelConsumption, liquidQuantity, liquid_type, liquidConsumption,lon, lat, 
    crewMember, crewMemberCapacity, efficiency, facilityRefID) {

    const PUT_VEHICLE_URL = "http://127.0.0.1:8094/vehicle"; // 8081/vehicle/
    let context = {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "id":id,
            "remoteId":remoteId,
            "efficiency":efficiency,
            "liquidConsumption":liquidConsumption,
            "fuelConsumption":fuelConsumption,
            "crewMember":crewMember,
            "crewMemberCapacity":crewMemberCapacity,
            "facilityRefID":facilityRefID,
            "lon":lon,
            "lat":lat,
            "type":vehicle_type,
            "liquidType":liquid_type,
            "liquidQuantity":liquidQuantity,
            "fuel":fuel
        })
    };
    //return if needed
    fetch(PUT_VEHICLE_URL, context)
        .catch(error => err_callback(error));
}

//Create vehicle from interface. Vehicle is created using create_vehicle
function vehicle_creator() {
    var vehicle_type = document.getElementById("vehicle_type").value;
    var liquid_type = document.getElementById("liquid_type").value;
    var lat = 0;
    var lon = 0;
    var facility = 0;
    for (station of stationList) {
        vehicle_station = document.getElementById("vehicle_station").value;
        if (vehicle_station == station.id) {
            lat = station.lat;
            lon = station.lon;
            facility = station.id;
        }
    }
    //var lat = Math.random()*(45.7941125 - 45.7145454) + 45.7145454;
    //var lon = Math.random()*(4.9266428 - 4.7736324) + 4.7736324;
    var price = 100;
    price += vehicle_type*15
    if (liquid_type == 0) {
        price += 100;
    } else {
        price += 20;
    }
    if (money >= price) {
        money = money - price;
        create_vehicle(vehicle_type, liquid_type, lon, lat, facility);
    } else {
        alert("The price is "+price+" $")
    }
}

//Takes the list of all vehicles as parameter. Calls vehicle_filter function for each vehicle to print them
function vehiclesList_callback(response) {    
    for(var i = 0; i < response.length; i++) {
        vehicleList[i] = response[i];
    }
    clear_vehicles();
    for(const vehicle of vehicleList) {
        vehicle_filter(vehicle);
    }
}

//Calls the print_vehicle function to print each vehicle which fits the filter parameters provided by the user
function vehicle_filter(vehicle) {
    if (document.getElementById(vehicle.type).checked == true) {
        if (document.getElementById(vehicle.liquidType).checked == true) {
            if (vehic_station_filter) {
                if (document.getElementById("STATION"+vehicle.facilityRefID).checked == true) {
                    print_vehicle(vehicle);
                }
            }
            else (print_vehicle(vehicle));
        }
    }
}

//Displays on the map the vehicle given in parameter
function print_vehicle(vehicle) {
    var fireIcon = L.icon({
        iconUrl: 'icons/car_map_filled.png',    
        iconSize: [51, 51], // size of the icon
        iconAnchor: [25.5, 40], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    var marker = L.marker([vehicle.lat, vehicle.lon], {icon: fireIcon}).addTo(vehiclesGroup);
    vehiclePrinted.push(marker);
}

//clear printed vehicles
function clear_vehicles() {
    for (i of vehiclePrinted) {
        i.remove();
    }
    vehiclePrinted = [];
}

//Fetch vehicle object when clicking on a vehicle marker 
//and calls the fill_popup_vehicle function to display the corresponding vehicle info
function fetch_vehicle_fromMarker(event) {
    clickedArea = event.latlng;

    var lat_marker = event.latlng.lat;
    var lng_marker = event.latlng.lng;
    for (vehicle of vehicleList) {
        if (vehicle.lon == lng_marker && vehicle.lat == lat_marker) {
            fill_popup_vehicle(vehicle);
            return;
        }
    }
}

function fill_popup_vehicle(vehicle) {
    document.getElementById("info_vehicle_id").value = vehicle.id;
    document.getElementById("info_vehicle_img").src = "images/" + vehicle.type;
    document.getElementById("info_vehicle_type").innerHTML = "Type : " + pretty_text(vehicle.type);
    document.getElementById("info_vehicle_fuel").innerHTML = "Fuel quantity : " + vehicle.fuel;
    document.getElementById("info_vehicle_liquid_type").innerHTML = "Liquid type : " + pretty_text(vehicle.liquidType);
    document.getElementById("info_vehicle_liquid_quantity").innerHTML = "Liquid quantity : " + vehicle.liquidQuantity;
    for (station of stationList) {
        if (vehicle.facilityRefID == station.id) {
            document.getElementById("info_vehicle_station").innerHTML = "Fire station : " + station.name;
        }
    }

    document.getElementById("over_map_left").style.display = 'block';
    document.getElementById("over_map_left_bottom").style.display = 'block';
    document.getElementById("info_vehicle_update").style.display = 'none';
    document.getElementById("info_vehicle").style.display = 'block';
    document.getElementById("info_fire").style.display = 'none';
    document.getElementById("info_station").style.display = 'none';
}

//Updates the vehicle popup when it's already open
function live_fill_popup_vehicle(clkA) {
    var lat = clkA.lat;
    var long = clkA.lng;
    var good_vehicle;
    for (vehicle of vehicleList) {
        if (vehicle.lon == long && vehicle.lat == lat) {
            good_vehicle = vehicle;
            document.getElementById("info_vehicle_id").value = good_vehicle.id;
            document.getElementById("info_vehicle_img").src = "images/" + good_vehicle.type;
            document.getElementById("info_vehicle_type").innerHTML = "Type : " + pretty_text(good_vehicle.type);
            document.getElementById("info_vehicle_fuel").innerHTML = "Fuel quantity : " + good_vehicle.fuel;
            document.getElementById("info_vehicle_liquid_type").innerHTML = "Liquid type : " + pretty_text(good_vehicle.liquidType);
            document.getElementById("info_vehicle_liquid_quantity").innerHTML = "Liquid quantity : " + good_vehicle.liquidQuantity;
        }
    }
}

function delete_vehicle(id_vehicle) {
    const DELETE_VEHICLE_URL = "http://127.0.0.1:8094/vehicle/"+id_vehicle; // 8081/vehicle/ /////-------------------
    let context = {
        method: 'DELETE',
    };
    fetch(DELETE_VEHICLE_URL, context)
        .catch(error => err_callback(error));
}

function button_delete_vehicle() {
    id_vehicle = document.getElementById("info_vehicle_id").value;
    money += 100;
    delete_vehicle(id_vehicle);
    document.getElementById("over_map_left").style.display = 'none';
}

//Triggers the fecth vehicle by id then calls the vehicle_update_callback to update vehicle attributes
function button_update_vehicle() {
    //get vehicle id
    let vId = document.getElementById("info_vehicle_id").value;
    fetch_vehicle_byId(vId, vehicle_update_callback);
}

function vehicle_update_callback(vJSON) {
    modify_vehicle(vJSON.id, vJSON.remoteId, document.getElementById("vehicle_type_update").value, document.getElementById("fuel_value_update").value, 
    vJSON.fuelConsumption, document.getElementById("liquid_quantity_update").value, document.getElementById("liquid_type_update").value, 
    vJSON.liquidConsumption, vJSON.lon, vJSON.lat, vJSON.crewMember, vJSON.crewMemberCapacity, vJSON.efficiency, vJSON.facilityRefID);
}

function station_vehicle_creator() {
    if (document.getElementById("vehicle_creator").style.display == "none") {
        var text_html = "";
        for (station of stationList) {
            text_html += "<option value="+station.id+">"+station.name+"</option>";
        }
        if (text_html != "") {
            document.getElementById("vehicle_station").innerHTML = text_html;
        }
    }
}

function station_vehicle_interface() {
    if (document.getElementById("vehicle_interface").style.display == "none") {
        var text_html = "";
        for (station of stationList) {
            text_html += "<div><input type='checkbox' id=STATION"+station.id+" name="+station.name+" checked><label for="+station.name+">"+station.name+"</label></div>"
        }
        if (text_html != "") {
            document.getElementById("vehicle_interface_station").innerHTML = text_html;
            vehic_station_filter = true;
        }
    }
}


// FUNCTIONS FIRE STATION ----------------------------------------------------------------------------------------------------

/*
    POST
    GET
    Print (purple)
    Vehicle pop here + fuel + liquid
*/


//Uses a POST request to create a station given some basic parameters of the station
function create_station(name, capacity,lon, lat) {
    const POST_STATION_URL = "http://127.0.0.1:8098/createStation";
    let context = {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "name":name,
            "capacity":capacity,
            "lon":lon,
            "lat":lat
        })
    };
    fetch(POST_STATION_URL, context)
        .catch(error => err_callback(error));
}

function fetch_stations() {
    const GET_STATION_URL = "http://127.0.0.1:8098/getAllStation";
    let context = {
        method: 'GET',
    };
    stationList = [];
    fetch(GET_STATION_URL, context)
        .then(response => response.json().then(body => stationList_callback(body)))
        .catch(error => err_callback_stations(error));
}

function err_callback_stations() {
    clear_stations();
}

//Takes the list of all stations as parameter. Calls print_station function for each vehicle to print them
function stationList_callback(response) {    
    for(var i = 0; i < response.length; i++) {
        stationList[i] = response[i];
    }
    station_vehicle_creator();
    station_vehicle_interface();
    clear_stations();
    for(const station of stationList) {
        print_station(station);
    }
}

//Displays on the map the station given in parameter
function print_station(station) {
    var stationIcon = L.icon({
        iconUrl: 'icons/fire_station.png',    
        iconSize: [34, 34], // size of the icon
        iconAnchor: [17, 30], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    var marker = L.marker([station.lat, station.lon], {icon: stationIcon}).addTo(stationGroup);
    stationPrinted.push(marker);
}

//clear printed stations
function clear_stations() {
    for (i of stationPrinted) {
        i.remove();
    }
    stationPrinted = [];
}

//Fills the popup concerning the Fire Station
function fill_popup_station(station) {
    document.getElementById("info_station_name").innerHTML = "Nom : "  + station.name;
    document.getElementById("info_station_capacity").innerHTML = "Capacity : " + station.capacity;


    document.getElementById("over_map_left").style.display = 'block';
    document.getElementById("over_map_left_bottom").style.display = 'none';
    document.getElementById("info_vehicle_update").style.display = 'none';
    document.getElementById("info_vehicle").style.display = 'none';
    document.getElementById("info_fire").style.display = 'none';
    document.getElementById("info_station").style.display = 'block';
}

function fetch_station_fromMarker(event) {
    var lat_marker = event.latlng.lat;
    var lng_marker = event.latlng.lng;
    for (station of stationList) {
        if (station.lon == lng_marker && station.lat == lat_marker) {
            fill_popup_station(station);
            return;
        }
    }
}

//Create fire station from interface. Station is created using create_station
function station_creator() {
    var name = document.getElementById("station_name").value;
    var capacity = document.getElementById("station_capacity").value;
    var lat = document.getElementById("station_lat").value;
    var lon = document.getElementById("station_long").value;
    if (money > 1000) {
        money = money -= 1000;
        create_station(name, capacity, lon, lat);
    } else {
        alert("The price is 1000 $")
    }
}

// FUNCTIONS OTHERS ----------------------------------------------------------------------------------------------------

//Hides the right interface given in parameters. Also hides all its childs
function hide_interface(obj) {
    var el = document.getElementById(obj);
    if (el.style.display == 'none') {
        var interface = document.getElementsByClassName("interface");
        for (i of interface) {
            i.style.display = 'none';
        }
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

//Hides left interface when clicking at a random spot on the map
function hide_interface_left(event) {
    var lat_marker = event.latlng.lat;
    var lng_marker = event.latlng.lng;

    for (vehicle of vehicleList) {
        if (vehicle.lon == lng_marker && vehicle.lat == lat_marker) {
            return;
        }
    }
    for (fire of fireList) {
        if (fire.lon == lng_marker && fire.lat == lat_marker) {
            return;
        }
    }
    for (station of stationList) {
        if (station.lon == lng_marker && station.lat == lat_marker) {
            return;
        }
    }
   document.getElementById("over_map_left").style.display = 'None';
}

function pretty_text (name) {
    var pretty_name = "";
    var lower_flag = 0;
    for (i of name) {
        if (i == "_") {
            lower_flag = 0;
            pretty_name += " ";
        } else {
            if (lower_flag == 1) {
                pretty_name += i.toLowerCase();
            } else {
                pretty_name += i;
                lower_flag = 1;
            }
        }
    }
    return pretty_name;
}

//Manages the display of the left panel when it's clicked
function switch_left_interface_display(obj) {
    var el = document.getElementById(obj);
    if (el.id == "info_vehicle") {
        if (el.style.display == 'none') {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    } else if (el.id == "info_vehicle_update") {
        if (el.style.display != 'none') {
            el.style.display = 'none';
        } else {
            el.style.display = 'block';
        }
    }
}

function switch_map_style() {
    var map_style;
    for (var i = 1; i < 4; i++) {
        map_style = document.getElementById("map_style"+i);
        if (map_style.checked) {
            mymap.removeLayer(map_layer);
            map_layer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
	            //minZoom: 10,
                maxZoom: 20,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox/' + map_style.value,
                tileSize: 512,
                zoomOffset: -1,
            }).addTo(mymap);
        }
    }
}

//LOGS errors on console
function err_callback(error) {
    //console.log(error);
}

// CODE ----------------------------------------------------------------------------------------------------

//MAP INITIALISATION
var mymap = L.map('mapid').setView([45.76392211069434, 4.832544118002555], 12);  // [51.505, -0.09], 13


var map_layer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
	//minZoom: 10,
    maxZoom: 20,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1,
    //id: 'mapbox/dark-v10'
    //id: 'mapbox/satellite-v9',
}).addTo(mymap);


switch_map_style();
mymap.on('click', hide_interface_left);

//GLOBAL variables
let fireList = [];
let firePrinted = [];
var fireGroup = L.featureGroup().addTo(mymap).on("click", fetch_fire_fromMarker);

let vehicleList = [];
let vehiclePrinted = [];
var vehiclesGroup = L.featureGroup().addTo(mymap).on("click", fetch_vehicle_fromMarker);

let stationList = [];
let stationPrinted = [];
let stationGroup = L.featureGroup().addTo(mymap).on("click", fetch_station_fromMarker);

let clickedArea;

let vehic_station_filter = false;

//Functions called every time the page is refreshed
//create_vehicle(0, 1, 4.5, 45.5);
//modify_vehicle(id, vehicle_type, fuel, fuelConsumption, liquidQuantity, liquid_type, liquidConsumption,lon, lat, 
//crewMember, crewMemberCapacity, efficiency, facilityRefID)
//modify_vehicle(10453, 3, 0, 0, 10, 3, 20, 1, 1, 23, 25, 12, 45);   //TODO USE POSTEMAN PUT REQUEST TO UPDATE VEHICLE
put_config();

fetch_fire();
fetch_vehicles();
fetch_stations();

setTimeout(function(){
    if (stationList.length == 0) {
        create_station("CPE Lyon", 100, 4.86904827217447, 45.78391737991209);
        setTimeout(function(){
            fetch_stations();
            setTimeout(function(){
                station = stationList[0];
                create_vehicle(1, 1, 4.86904827217447, 45.78391737991209, station.id);
            }, 100);
        }, 100);
    }
}, 100);


//Instructions called every 1000 ms
var intervalId = window.setInterval(function(){
    if (document.getElementById("info_fire").style.display == 'block') {
        live_fill_popup_fire(clickedArea);
    }
    if (document.getElementById("info_vehicle").style.display == 'block') {
        live_fill_popup_vehicle(clickedArea);
    }
    addMoney();
    addTime();
    printPlay();
    setDifficulty();
    fetch_fire();
    fetch_vehicles();
    fetch_stations();
    setTimeout(function(){
        station_vehicle_creator()
        station_vehicle_interface()
    }, 250);
}, 1000);



// GAME ----------------------------------------------------------------------------------------------------

let price = 0;
let money = 0;
let time = 0;

function addMoney() {
    var malus = 5*fireList.length;
    var bonus;
    if (malus == 0) {
        bonus = 100;
    }
    money = money+10+bonus-malus;
}

function addTime() {
    time += 1;
}

function printPlay() {
    document.getElementById("money").innerHTML = money+" $";
    var min = Math.floor(time/60);
    var sec = time%60;
    if (min < 10) {
        min = "0"+min;
    }
    if (sec < 10) {
        sec = "0"+sec;
    }
    document.getElementById("time").innerHTML = min+":"+sec;
}

function setDifficulty() {
    if (time > 600) {
        put_creation_config(1, 1*1000);
    }
    else if (time > 420) {
        put_creation_config(1, 3*1000);
    }
    else if (time > 300) {
        put_creation_config(1, 5*1000);
    }
    else if (time > 240) {
        put_creation_config(1, 10*1000);
    }
    else if (time > 180) {
        put_creation_config(0.75, 10*1000);
    }
    else if (time > 120) {
        put_creation_config(1, 20*1000);
    }
    else if (time > 60) {
        put_creation_config(0.75, 20*1000);
    }
    else if (time > 0) {
        put_creation_config(1, 30*1000);
    }
    
}