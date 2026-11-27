import { MusicPlayer } from '../common/music-player/music-player'
import { About } from './about'
import { Favorites } from './favorites'
import { FilmPreview, FilmViewDrawer } from './film'
import { HotkeysView } from './hotkeys'
import { JamModal } from './jam'
import { LowFpsAlert } from './low-fps-alert'
import { Playlists } from './playlists'
import { ReportSongModal } from './report/report-song-modal'
import { MusicSearchModal } from './search/music-search-modal'
import { Settings } from './settings'

const PrimaryViews = () => (
  <>
    <Settings />
    <About />
    <Favorites />
    <Playlists />
    <FilmPreview poster={true} />
    <FilmViewDrawer />
    <LowFpsAlert />
    <HotkeysView />
    <MusicPlayer />
    <MusicSearchModal />
    <ReportSongModal />
    <JamModal />
  </>
)

export default PrimaryViews
