import './App.css'
import { useEffect, useState } from 'react'
import type { Device, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { useSpotify } from './hooks/useSpotify';

import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Button from '@mui/joy/Button';
import Stack from '@mui/system/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';

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
  const [intialLoad, setInitialLoad] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [invalidUser, setInvalidUser] = useState(false);
  const maxPlaylistItemLimit = 50;

  useEffect(() => {
    setDevicesLoading(true);

    const loadDevices = async () => {
      sdk.currentUser.profile().then((res) => {
        if (res.id !== "thesamjas") {
          setInvalidUser(true);
        }
        else {
          sdk.player.getAvailableDevices().then((res) => {
            setDevices(res.devices);

            let activeDevices = res.devices.filter(y => y.is_active);
            if (activeDevices.length > 0 && !selectedDevice) {
              setSelectedDevice(activeDevices[0].id);
            }
            setDevicesLoading(false);
          });
        }
        setInitialLoad(false);
      })
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
          shuffle(trackIds)
          sdk.player.startResumePlayback(deviceId, undefined, trackIds, undefined, undefined);
          setTracksLoading(false);
        }
      });
    });
  }

  // https://stackoverflow.com/a/2450976
  const shuffle = (array: any[]) => {
    let currentIndex = array.length;

    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  }

  const handleChange = (_event: React.SyntheticEvent | null, newValue: string | null) => {
    setSelectedDevice(newValue);
  };

  const refresh = () => {
    setRefreshKey(x => x + 1);
  }

  if (intialLoad) {
    return <CircularProgress variant='plain' />
  }

  if (invalidUser) {
    return <Alert color="warning">
      <Stack direction='column'>
        <b>Sorry, Playlist Mixer is built for personal use</b>
        <br />
        <span>This app does not support other users at this time.</span>
        <span>If you're interested, the source for this project lives in <a href='https://github.com/sjasct/playlist-mix'>this GitHub repo</a>.</span>
      </Stack>
    </Alert>
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
