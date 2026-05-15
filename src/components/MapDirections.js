

export function MapToFood(address){
    
    const encAddress = encodeURIComponent(address)

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encAddress}`

    window.open(googleMaps, '_blank')

}
