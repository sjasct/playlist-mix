import './App.css'
import { useEffect, useState } from 'react'
import type { Device, Devices, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useSpotify } from './hooks/useSpotify';

import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Button from '@mui/joy/Button';

function App() {
  const sdk = useSpotify("5eca27e4e5304f898d675670471c8bb1", "http://localhost:5173", ["user-read-playback-state", "user-modify-playback-state", "playlist-read-private"]);

  return (
    <div>
      {sdk ? (<CoreApp sdk={sdk} />) : <p>Authenticating...</p>}
    </div>
  )
}

function CoreApp({ sdk }: { sdk: SpotifyApi }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const maxPlaylistItemLimit = 50;

  useEffect(() => {
    setLoading(true);

    const getData = async () => {
      var deviceResponse = await sdk.player.getAvailableDevices();
      setDevices(deviceResponse.devices);

      let activeDevices = deviceResponse.devices.filter(y => y.is_active);
      if(activeDevices.length > 0){
        setSelectedDevice(activeDevices[0].id);
      }
    }

    getData();
    setLoading(false)
  }, [])

  if (loading || !devices) {
    return (<p>loading</p>)
  }

  const playlistIds = [
    "1O5ArNRDbxDgtMYIlKkimA",
    "1fciLNsmAdiahiuV7kCFOH",
    "3N9zBtQCrMkwJg5VWsoyuC",
    "4qK8lFyDDh8r4eAQjtO2MS",
    "00wJS6fyHVf4sWy0Px2XSa"
  ];

  const getPlaylistItems = (id: string, offset: number,  resolve: (trackIds: string[]) => void, existingIds = [] as string[]) => {
    sdk.playlists.getPlaylistItems(id, undefined, undefined, maxPlaylistItemLimit, offset, undefined).then((r) => {
      existingIds = existingIds.concat(r.items.map((y) => `spotify:track:${y.track.id}`))

      if(r.next){
        getPlaylistItems(id, offset + maxPlaylistItemLimit, resolve, existingIds);
      }
      else{
        resolve(existingIds);
      }
    })
  }

  const playTracks = (deviceId : string) => {
    setTracksLoading(true);

    let completedCount = 0;
    let trackIds = [] as string[];

    playlistIds.forEach((id) => {
      getPlaylistItems(id, 0, (newTracks) => {
        trackIds = trackIds.concat(newTracks);
        completedCount++;

        if(completedCount === playlistIds.length){
          sdk.player.startResumePlayback(deviceId, undefined, trackIds, undefined, undefined);
          setTracksLoading(false);
        }
      });
    });
  }

  const handleChange = (
    event: React.SyntheticEvent | null,
    newValue: string | null,
  ) => {
    console.log(newValue);
    setSelectedDevice(newValue);
  };

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <Select onChange={handleChange} value={selectedDevice}>
        {devices.map((device) => (
          <Option key={device.id} value={device.id}>{device.name} {device.is_active && "(Active)"}</Option>
        ))}
      </Select>
      <Button onClick={async () => await playTracks(selectedDevice!)} loading={tracksLoading} disabled={!selectedDevice}>Play</Button>
    </div>
  );

}

export default App;
