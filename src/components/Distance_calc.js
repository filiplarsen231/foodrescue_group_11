
async function distanceClac(origin, destination){
    
    
    const API_KEY = "AIzaSyCjNsLzUbZz1D522m-rb9DnCSTkcKLuV_M";

    const URL = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${destination}&origins=${origin}&key=${API_KEY}`

    const response = await fetch(URL)
    const data = await response.json()

    

    //console.log("Google data: ", data)
    
    const distance = data.rows[0].elements[0].distance.value

    //console.log("Distance: ", distance)

    return distance
}

const test_origin = "Lärdomsgatan 9, Göteborg"
const test_destination = "Vasagatan 33, Göteborg"


const dist = await distanceClac(test_origin, test_destination)

console.log("testing: ", dist)