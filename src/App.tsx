import './App.css'
import { useEffect, useState } from 'react'
import type { Device, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useSpotify } from './hooks/useSpotify';

import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Button from '@mui/joy/Button';
import Stack from '@mui/system/Stack';

function App() {
  const sdk = useSpotify(import.meta.env.VITE_SPOTIFY_CLIENT_ID, import.meta.env.VITE_REDIRECT_URL, ["user-read-playback-state", "user-modify-playback-state", "playlist-read-private"]);

  return (
    <div>
      {sdk ? (<CoreApp sdk={sdk} />) : <p>Authenticating...</p>}
    </div>
  )
}

function CoreApp({ sdk }: { sdk: SpotifyApi }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const maxPlaylistItemLimit = 50;

  useEffect(() => {
    setDevicesLoading(true);

    const loadDevices = async () => {
      sdk.player.getAvailableDevices().then((res) => {
        setDevices(res.devices);

        let activeDevices = res.devices.filter(y => y.is_active);
        if (activeDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(activeDevices[0].id);
        }
        setDevicesLoading(false)
      });
    }

    loadDevices();
  }, [refreshKey])

  // this is temp while it's just for personal use
  const playlistIds = [
    "1O5ArNRDbxDgtMYIlKkimA",
    "1fciLNsmAdiahiuV7kCFOH",
    "3N9zBtQCrMkwJg5VWsoyuC",
    "4qK8lFyDDh8r4eAQjtO2MS",
    "00wJS6fyHVf4sWy0Px2XSa"
  ];

  const getPlaylistItems = (id: string, offset: number, resolve: (trackIds: string[]) => void, existingIds = [] as string[]) => {
    sdk.playlists.getPlaylistItems(id, undefined, undefined, maxPlaylistItemLimit, offset, undefined).then((r) => {
      existingIds = existingIds.concat(r.items.map((y) => `spotify:track:${y.track.id}`))

      if (r.next) {
        getPlaylistItems(id, offset + maxPlaylistItemLimit, resolve, existingIds);
      }
      else {
        resolve(existingIds);
      }
    })
  }

  const playTracks = (deviceId: string) => {
    setTracksLoading(true);

    let completedCount = 0;
    let trackIds = [] as string[];

    playlistIds.forEach((id) => {
      getPlaylistItems(id, 0, (newTracks) => {
        trackIds = trackIds.concat(newTracks);
        completedCount++;

        if (completedCount === playlistIds.length) {
          sdk.player.startResumePlayback(deviceId, undefined, trackIds, undefined, undefined);
          setTracksLoading(false);
        }
      });
    });
  }

  const handleChange = (_event: React.SyntheticEvent | null, newValue: string | null) => {
    setSelectedDevice(newValue);
  };

  const refresh = () => {
    setRefreshKey(x => x + 1);
  }

  return (
    <Stack
      direction="column"
      spacing={3}
      sx={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h2>Playlist Mixer</h2>
      <p>Select a Spotify Connect device</p>
      <Select onChange={handleChange} value={selectedDevice} disabled={devicesLoading || tracksLoading}>
        {devices.map((device) => (
          <Option key={device.id} value={device.id}>{device.name} {device.is_active && "(Active)"}</Option>
        ))}
      </Select>

      <Button onClick={async () => await playTracks(selectedDevice!)} loading={tracksLoading} disabled={!selectedDevice || devicesLoading}>Play</Button>
      <Button color="neutral" onClick={refresh} loading={devicesLoading}>Refresh Devices</Button>
    </Stack>
  );

}

export default App;
