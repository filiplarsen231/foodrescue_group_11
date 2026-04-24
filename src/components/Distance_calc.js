

//Använd await innnan om du kallar denna funktion
async function Calc_Distance(origin, destination){
    
    const API_KEY = "AIzaSyCjNsLzUbZz1D522m-rb9DnCSTkcKLuV_M";
    const URL = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${destination}&origins=${origin}&key=${API_KEY}`
    
    try{
        const response = await fetch(URL)
        const data = await response.json()
        if(data.status == "OK"){
            const distance = data.rows[0].elements[0].distance.value
            return distance
        }
    }catch{
        console.log("Error")
    }
   
}


async function Calc_Distance_Multi(origin, destinations) {
    
    const API_KEY = "AIzaSyCjNsLzUbZz1D522m-rb9DnCSTkcKLuV_M";
    const destinationsApiFormat = destinations.join("|")
    const URL = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${destinationsApiFormat}&origins=${origin}&key=${API_KEY}`

    try{
        const response = await fetch(URL)
        const data = await response.json()
        
        if(data.status == "OK"){
            const dataList = []
            for(let i = 0; i < data.rows[0].elements.length; i++){
                dataList.push(data.rows[0].elements[i].distance.value)
            }
            return dataList
        }
    }catch{
        console.log("Error")
    }

}









/*const test_origin = "Lärdomsgatan 9, Göteborg"
const test_destination = "Vasagatan 33, Göteborg"
const tesst_dest2 = "Tubogatan 13, Norrköping"
const distarray = [test_destination, tesst_dest2]


const dist1 = await Calc_Distance(test_origin, test_destination)

const dist2 = await Calc_Distance_Multi(test_origin, distarray)

console.log("testing singel: ", dist1)

console.log("testing multi: ", dist2)*/

//https://console.cloud.google.com/marketplace/product/google/distance-matrix-backend.googleapis.com?q=search&referrer=search&project=project-03e05d93-b3c7-48de-bc7
//https://developers.google.com/maps/documentation/distance-matrix/start#maps_http_distancematrix_start-txt