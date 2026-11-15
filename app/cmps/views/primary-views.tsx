import { About } from './about'
import { Favorites } from './favorites'
import { FilmPreview, FilmViewDrawer } from './film'
import { HotkeysView } from './hotkeys'
import { LowFpsAlert } from './low-fps-alert'
import { Settings } from './settings'
import { MusicPlayer } from '../common/music-player/music-player'
import { MusicSearchModal } from './search/music-search-modal'
import { ReportSongModal } from './report/report-song-modal'

const PrimaryViews = () => (
  <>
    <Settings />
    <About />
    <Favorites />
    <FilmPreview poster={true} />
    <FilmViewDrawer />
    <LowFpsAlert />
    <HotkeysView />
    <MusicPlayer />
    <MusicSearchModal />
    <ReportSongModal />
  </>
)

export default PrimaryViews
