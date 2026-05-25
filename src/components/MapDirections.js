

export function MapToFood(address){
    
    try{ 
        const encAddress = encodeURIComponent(address)

        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encAddress}`

        window.open(googleMaps, '_blank')
    }
    catch {
        console.log("wrong address format for directions")
    }
    

}

