import './App.css'
import { useEffect, useState } from 'react'
import type { Devices, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useSpotify } from './hooks/useSpotify';

function App() {
  const sdk = useSpotify("5eca27e4e5304f898d675670471c8bb1", "http://localhost:5173", ["user-read-playback-state", "user-modify-playback-state", "playlist-read-private"]);

  return (
    <div className="App">
      {sdk ? (<CoreApp sdk={sdk} />) : <p>Authenticating...</p>}
    </div>
  )
}

function CoreApp({ sdk }: { sdk: SpotifyApi }) {
  const [devices, setDevices] = useState<Devices | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const getData = async () => {
      setDevices(await sdk.player.getAvailableDevices())
    }

    getData();
    setLoading(false)
  }, [])

  if (loading || !devices) {
    return (<p>loading</p>)
  }

  return (
    devices?.devices.map((d) => (
      <p>{d.name}</p>
    ))
  );

}

export default App;
