import json
import os
import math
import struct
import subprocess

ALBUMS_DATA = [
    # --- 1960s & 1970s Classic Rock & Psychedelic ---
    {
        "id": 0,
        "title": "The Dark Side of the Moon",
        "artist": "Pink Floyd",
        "release_year": "1973",
        "genres": "Progressive Rock, Art Rock, Psychedelic Rock",
        "vote_average": "9.8",
        "vote_count": 48200,
        "popularity": "99.8",
        "tagline": "There is no dark side in the moon, really. Matter of fact, it's all dark.",
        "overview": "Recorded at Abbey Road Studios with engineer Alan Parsons, The Dark Side of the Moon is a conceptual masterpiece exploring greed, mental illness, passage of time, and mortality. Famous for its iconic prism artwork designed by Storm Thorgerson.",
        "tracks": [
            {"number": 1, "title": "Speak to Me", "duration": "1:07"},
            {"number": 2, "title": "Breathe (In the Air)", "duration": "2:49"},
            {"number": 3, "title": "On the Run", "duration": "3:45"},
            {"number": 4, "title": "Time", "duration": "6:53"},
            {"number": 5, "title": "The Great Gig in the Sky", "duration": "4:44"},
            {"number": 6, "title": "Money", "duration": "6:22"},
            {"number": 7, "title": "Us and Them", "duration": "7:49"},
            {"number": 8, "title": "Any Colour You Like", "duration": "3:26"},
            {"number": 9, "title": "Brain Damage", "duration": "3:46"},
            {"number": 10, "title": "Eclipse", "duration": "2:10"}
        ],
        "bg_color": (15, 15, 20),
        "accent_color": (0, 220, 255)
    },
    {
        "id": 1,
        "title": "Abbey Road",
        "artist": "The Beatles",
        "release_year": "1969",
        "genres": "Rock, Pop Rock, Psychedelic Pop",
        "vote_average": "9.7",
        "vote_count": 46500,
        "popularity": "99.2",
        "tagline": "And in the end, the love you take is equal to the love you make.",
        "overview": "The eleventh studio album by the Beatles, featuring the legendary 16-minute side-two medley and timeless classics like 'Come Together' and 'Here Comes the Sun'. Its crosswalk cover is one of the most famous images in pop culture.",
        "tracks": [
            {"number": 1, "title": "Come Together", "duration": "4:20"},
            {"number": 2, "title": "Something", "duration": "3:03"},
            {"number": 3, "title": "Maxwell's Silver Hammer", "duration": "3:27"},
            {"number": 4, "title": "Oh! Darling", "duration": "3:26"},
            {"number": 5, "title": "Octopus's Garden", "duration": "2:51"},
            {"number": 6, "title": "I Want You (She's So Heavy)", "duration": "7:47"},
            {"number": 7, "title": "Here Comes the Sun", "duration": "3:05"},
            {"number": 8, "title": "Because", "duration": "2:45"},
            {"number": 9, "title": "You Never Give Me Your Money", "duration": "4:02"},
            {"number": 10, "title": "The End", "duration": "2:20"}
        ],
        "bg_color": (30, 45, 60),
        "accent_color": (255, 200, 50)
    },
    {
        "id": 2,
        "title": "Rumours",
        "artist": "Fleetwood Mac",
        "release_year": "1977",
        "genres": "Pop Rock, Soft Rock, Classic Rock",
        "vote_average": "9.6",
        "vote_count": 42000,
        "popularity": "98.5",
        "tagline": "Thunder only happens when it's raining.",
        "overview": "Written amidst intra-band romantic breakdowns and emotional turbulence, Rumours produced quintessential melodic pop-rock perfection, selling over 40 million copies worldwide.",
        "tracks": [
            {"number": 1, "title": "Second Hand News", "duration": "2:53"},
            {"number": 2, "title": "Dreams", "duration": "4:14"},
            {"number": 3, "title": "Never Going Back Again", "duration": "2:14"},
            {"number": 4, "title": "Don't Stop", "duration": "3:13"},
            {"number": 5, "title": "Go Your Own Way", "duration": "3:38"},
            {"number": 6, "title": "Songbird", "duration": "3:20"},
            {"number": 7, "title": "The Chain", "duration": "4:30"},
            {"number": 8, "title": "You Make Loving Fun", "duration": "3:31"},
            {"number": 9, "title": "Gold Dust Woman", "duration": "4:51"}
        ],
        "bg_color": (45, 35, 25),
        "accent_color": (230, 180, 100)
    },
    {
        "id": 3,
        "title": "Thriller",
        "artist": "Michael Jackson",
        "release_year": "1982",
        "genres": "Pop, Post-Disco, Funk, Rock",
        "vote_average": "9.7",
        "vote_count": 49000,
        "popularity": "99.5",
        "tagline": "The best-selling album in music history.",
        "overview": "Produced by Quincy Jones, Thriller redefined the music industry, music videos, and global pop culture with seven Billboard Top 10 singles including 'Billie Jean', 'Beat It', and 'Thriller'.",
        "tracks": [
            {"number": 1, "title": "Wanna Be Startin' Somethin'", "duration": "6:03"},
            {"number": 2, "title": "Baby Be Mine", "duration": "4:20"},
            {"number": 3, "title": "The Girl Is Mine", "duration": "3:42"},
            {"number": 4, "title": "Thriller", "duration": "5:57"},
            {"number": 5, "title": "Beat It", "duration": "4:18"},
            {"number": 6, "title": "Billie Jean", "duration": "4:54"},
            {"number": 7, "title": "Human Nature", "duration": "4:06"},
            {"number": 8, "title": "P.Y.T. (Pretty Young Thing)", "duration": "3:59"},
            {"number": 9, "title": "The Lady in My Life", "duration": "5:00"}
        ],
        "bg_color": (30, 20, 25),
        "accent_color": (220, 40, 60)
    },
    {
        "id": 4,
        "title": "Discovery",
        "artist": "Daft Punk",
        "release_year": "2001",
        "genres": "French House, Synth-Pop, Nu-Disco",
        "vote_average": "9.6",
        "vote_count": 39500,
        "popularity": "97.9",
        "tagline": "One More Time across the galaxy.",
        "overview": "A landmark electronic record blending vintage disco sampling with futuristic talk-box vocoders. Conceived as the soundtrack to the anime film Interstella 5555 alongside Leiji Matsumoto.",
        "tracks": [
            {"number": 1, "title": "One More Time", "duration": "5:20"},
            {"number": 2, "title": "Aerodynamic", "duration": "3:27"},
            {"number": 3, "title": "Digital Love", "duration": "4:58"},
            {"number": 4, "title": "Harder, Better, Faster, Stronger", "duration": "3:45"},
            {"number": 5, "title": "Crescendolls", "duration": "3:31"},
            {"number": 6, "title": "Nightvision", "duration": "1:44"},
            {"number": 7, "title": "Superheroes", "duration": "3:57"},
            {"number": 8, "title": "High Life", "duration": "3:22"},
            {"number": 9, "title": "Something About Us", "duration": "3:51"},
            {"number": 10, "title": "Voyager", "duration": "3:47"},
            {"number": 11, "title": "Veridis Quo", "duration": "5:44"},
            {"number": 12, "title": "Face to Face", "duration": "4:00"}
        ],
        "bg_color": (15, 20, 40),
        "accent_color": (255, 180, 0)
    },
    {
        "id": 5,
        "title": "OK Computer",
        "artist": "Radiohead",
        "release_year": "1997",
        "genres": "Art Rock, Alternative Rock, Post-Rock",
        "vote_average": "9.8",
        "vote_count": 45000,
        "popularity": "98.6",
        "tagline": "Fitter, happier, more productive.",
        "overview": "Radiohead's prophetic portrait of 21st-century technological alienation, consumer capitalism, and existential paranoia. Marked a sonic shift toward complex orchestral layering and electronic experimentation.",
        "tracks": [
            {"number": 1, "title": "Airbag", "duration": "4:44"},
            {"number": 2, "title": "Paranoid Android", "duration": "6:23"},
            {"number": 3, "title": "Subterranean Homesick Alien", "duration": "4:27"},
            {"number": 4, "title": "Exit Music (For a Film)", "duration": "4:24"},
            {"number": 5, "title": "Let Down", "duration": "4:59"},
            {"number": 6, "title": "Karma Police", "duration": "4:21"},
            {"number": 7, "title": "Fitter Happier", "duration": "1:57"},
            {"number": 8, "title": "Electioneering", "duration": "3:50"},
            {"number": 9, "title": "Climbing Up the Walls", "duration": "4:45"},
            {"number": 10, "title": "No Surprises", "duration": "3:48"},
            {"number": 11, "title": "Lucky", "duration": "4:19"},
            {"number": 12, "title": "The Tourist", "duration": "5:24"}
        ],
        "bg_color": (20, 35, 45),
        "accent_color": (100, 200, 240)
    },
    {
        "id": 6,
        "title": "Nevermind",
        "artist": "Nirvana",
        "release_year": "1991",
        "genres": "Grunge, Alternative Rock, Punk Rock",
        "vote_average": "9.7",
        "vote_count": 47000,
        "popularity": "99.1",
        "tagline": "Here we are now, entertain us.",
        "overview": "Produced by Butch Vig, Nevermind catapulted underground Seattle grunge into the global mainstream, knocking Michael Jackson off the top of the charts and speaking for Generation X.",
        "tracks": [
            {"number": 1, "title": "Smells Like Teen Spirit", "duration": "5:01"},
            {"number": 2, "title": "In Bloom", "duration": "4:14"},
            {"number": 3, "title": "Come As You Are", "duration": "3:39"},
            {"number": 4, "title": "Breed", "duration": "3:03"},
            {"number": 5, "title": "Lithium", "duration": "4:17"},
            {"number": 6, "title": "Polly", "duration": "2:57"},
            {"number": 7, "title": "Territorial Pissings", "duration": "2:22"},
            {"number": 8, "title": "Drain You", "duration": "3:43"},
            {"number": 9, "title": "Lounge Act", "duration": "2:36"},
            {"number": 10, "title": "Stay Away", "duration": "3:32"},
            {"number": 11, "title": "On a Plain", "duration": "3:16"},
            {"number": 12, "title": "Something in the Way", "duration": "3:52"}
        ],
        "bg_color": (10, 40, 50),
        "accent_color": (30, 180, 220)
    },
    {
        "id": 7,
        "title": "Kind of Blue",
        "artist": "Miles Davis",
        "release_year": "1959",
        "genres": "Modal Jazz, Cool Jazz, Hard Bop",
        "vote_average": "9.9",
        "vote_count": 38000,
        "popularity": "97.5",
        "tagline": "The highest-selling and most influential jazz record ever cut.",
        "overview": "Featuring John Coltrane, Bill Evans, Cannonball Adderley, Paul Chambers, and Jimmy Cobb. Kind of Blue abandoned conventional chord changes for modal improvisation, crafting an immortal late-night mood.",
        "tracks": [
            {"number": 1, "title": "So What", "duration": "9:22"},
            {"number": 2, "title": "Freddie Freeloader", "duration": "9:46"},
            {"number": 3, "title": "Blue in Green", "duration": "5:37"},
            {"number": 4, "title": "All Blues", "duration": "11:33"},
            {"number": 5, "title": "Flamenco Sketches", "duration": "9:26"}
        ],
        "bg_color": (15, 20, 35),
        "accent_color": (40, 100, 200)
    },
    {
        "id": 8,
        "title": "To Pimp a Butterfly",
        "artist": "Kendrick Lamar",
        "release_year": "2015",
        "genres": "Conscious Hip-Hop, Jazz Rap, Funk, Neo-Soul",
        "vote_average": "9.8",
        "vote_count": 43500,
        "popularity": "98.9",
        "tagline": "We gon' be alright.",
        "overview": "An intricate, ambitious sonic and political triumph weaving West Coast hip-hop, free jazz, spoken word poetry, and P-funk. Won five Grammy Awards and stands as a definitive modern masterpiece.",
        "tracks": [
            {"number": 1, "title": "Wesley's Theory", "duration": "4:47"},
            {"number": 2, "title": "For Free? (Interlude)", "duration": "2:10"},
            {"number": 3, "title": "King Kunta", "duration": "3:54"},
            {"number": 4, "title": "Institutionalized", "duration": "4:31"},
            {"number": 5, "title": "These Walls", "duration": "5:00"},
            {"number": 6, "title": "u", "duration": "4:28"},
            {"number": 7, "title": "Alright", "duration": "3:39"},
            {"number": 8, "title": "The Blacker the Berry", "duration": "5:28"},
            {"number": 9, "title": "i", "duration": "5:36"},
            {"number": 10, "title": "Mortal Man", "duration": "12:07"}
        ],
        "bg_color": (25, 25, 25),
        "accent_color": (200, 180, 140)
    },
    {
        "id": 9,
        "title": "Purple Rain",
        "artist": "Prince and The Revolution",
        "release_year": "1984",
        "genres": "Pop Rock, Synth-Pop, R&B, Minneapolis Sound",
        "vote_average": "9.7",
        "vote_count": 41500,
        "popularity": "98.3",
        "tagline": "I only wanted to see you laughing in the purple rain.",
        "overview": "A towering fusion of blistering electric guitar, synthesizers, and soulful vocals. Soundtrack to the film of the same name, spending 24 consecutive weeks at No. 1 on the Billboard 200.",
        "tracks": [
            {"number": 1, "title": "Let's Go Crazy", "duration": "4:39"},
            {"number": 2, "title": "Take Me with U", "duration": "3:54"},
            {"number": 3, "title": "The Beautiful Ones", "duration": "5:13"},
            {"number": 4, "title": "Computer Blue", "duration": "3:59"},
            {"number": 5, "title": "Darling Nikki", "duration": "4:14"},
            {"number": 6, "title": "When Doves Cry", "duration": "5:54"},
            {"number": 7, "title": "I Would Die 4 U", "duration": "2:49"},
            {"number": 8, "title": "Baby I'm a Star", "duration": "4:24"},
            {"number": 9, "title": "Purple Rain", "duration": "8:41"}
        ],
        "bg_color": (35, 15, 45),
        "accent_color": (180, 60, 220)
    }
]

# Additional albums dynamically generated across all major music movements to total 216
EXTRA_ALBUMS = [
    # (Title, Artist, Year, Genres, Rating, Pop, Tagline, Overview)
    ("Led Zeppelin IV", "Led Zeppelin", "1971", "Hard Rock, Heavy Metal, Folk Rock", "9.7", "98.4", "Stairway to rock immortality.", "Featuring Stairway to Heaven, Black Dog, and When the Levee Breaks."),
    ("The Rise and Fall of Ziggy Stardust", "David Bowie", "1972", "Glam Rock, Art Rock, Proto-Punk", "9.7", "97.8", "There's a starman waiting in the sky.", "Bowie's conceptual story of an alien rock superstar delivering hope to Earth."),
    ("Songs in the Key of Life", "Stevie Wonder", "1976", "Soul, R&B, Funk, Jazz-Pop", "9.8", "97.6", "Sir Duke and Isn't She Lovely in all their glory.", "A double-LP tour de force representing Wonder's creative zenith."),
    ("Illmatic", "Nas", "1994", "East Coast Hip-Hop, Boombap", "9.8", "98.1", "The street's disciple.", "Arguably the greatest lyricism in hip-hop history recorded over Queensbridge beats."),
    ("Unknown Pleasures", "Joy Division", "1979", "Post-Punk, Gothic Rock", "9.6", "96.5", "Radio waves from a dying star.", "Produced by Martin Hannett, with Peter Saville's iconic pulsar radio graph cover."),
    ("A Love Supreme", "John Coltrane", "1965", "Spiritual Jazz, Modal Jazz", "9.8", "97.2", "A four-part devotional suite of pure transcendence.", "Coltrane's divine hymn of gratitude and spiritual awakening through saxophone."),
    ("What's Going On", "Marvin Gaye", "1971", "Soul, Motown, R&B", "9.8", "97.9", "Mother, mother, there's too many of you crying.", "Gaye's poignant concept album exploring civil rights, war, and ecology."),
    ("Never Mind the Bollocks", "Sex Pistols", "1977", "Punk Rock", "9.4", "95.5", "God Save the Queen and anarchy in the UK.", "The lightning rod of British punk rock rebellion."),
    ("Blue", "Joni Mitchell", "1971", "Folk Pop, Singer-Songwriter", "9.7", "96.8", "Songs are like tattoos.", "An unflinchingly intimate exploration of heartbreak, solitude, and love."),
    ("Paranoid", "Black Sabbath", "1970", "Heavy Metal, Doom Metal", "9.6", "97.3", "The blueprint for heavy metal.", "Featuring Iron Man, War Pigs, and Paranoid."),
    ("Random Access Memories", "Daft Punk", "2013", "Disco, Funk, Synth-Pop", "9.6", "98.2", "Give life back to music.", "Recorded entirely with live studio musicians, featuring Get Lucky."),
    ("Blonde", "Frank Ocean", "2016", "Neo-Soul, R&B, Art Pop", "9.7", "98.7", "We'll never be those kids again.", "A sprawling, introspective ambient-pop collage of memory and heartbreak."),
    ("Pet Sounds", "The Beach Boys", "1966", "Psychedelic Pop, Baroque Pop", "9.8", "97.5", "God only knows what I'd be without you.", "Brian Wilson's symphonic pop masterpiece that inspired Sgt. Pepper's."),
    ("Selected Ambient Works 85-92", "Aphex Twin", "1992", "Ambient Techno, IDM", "9.7", "96.4", "Lush, analog synthesizers from another dimension.", "Richard D. James's sublime electronic milestone."),
    ("Mezzanine", "Massive Attack", "1998", "Trip-Hop, Dark Wave, Downtempo", "9.6", "97.1", "Love, love is a verb. Love is a doing word.", "Brooding, nocturnal Bristol trip-hop with Elizabeth Fraser on Teardrop."),
    ("The Queen Is Dead", "The Smiths", "1986", "Jangle Pop, Indie Rock, Post-Punk", "9.6", "96.7", "There is a light that never goes out.", "Morrissey and Johnny Marr's crowning bittersweet achievement."),
    ("Disintegration", "The Cure", "1989", "Gothic Rock, Post-Punk, Dream Pop", "9.7", "97.0", "Pictures of You and Lovesong in rain-soaked majesty.", "Robert Smith's sweeping, melancholic atmospheric opus."),
    ("Exodus", "Bob Marley & The Wailers", "1977", "Roots Reggae", "9.7", "97.8", "One love, one heart.", "Recorded in London following an assassination attempt, celebrating freedom."),
    ("Kid A", "Radiohead", "2000", "Electronic, Post-Rock, Krautrock", "9.7", "97.5", "Everything in its right place.", "Radiohead dismantled rock guitar tropes for modular synths and jazz brass."),
    ("Master of Puppets", "Metallica", "1986", "Thrash Metal", "9.7", "97.6", "The pinnacle of speed, aggression, and musical precision.", "Metallica's defining thrash opus and Cliff Burton's final album."),
    ("Back to Black", "Amy Winehouse", "2006", "Soul, R&B, Motown", "9.6", "97.8", "You know that I'm no good.", "Produced by Mark Ronson and Salaam Remi, reviving classic 60s girl-group soul."),
    ("Revolver", "The Beatles", "1966", "Psychedelic Rock, Baroque Pop", "9.8", "98.0", "Turn off your mind, relax and float downstream.", "Groundbreaking tape loops, sitars, and string quartets on Eleanor Rigby."),
    ("London Calling", "The Clash", "1979", "Punk Rock, Post-Punk, Reggae Rock", "9.7", "97.2", "London calling to the faraway towns.", "A sprawling double album fusing punk, reggae, ska, and rockabilly."),
    ("Dummy", "Portishead", "1994", "Trip-Hop, Downtempo, Noir Jazz", "9.6", "96.3", "Glory Box and cinematic spy-soundtrack dread.", "Beth Gibbons' haunting vocals over scratched vinyl grooves."),
    ("Ready to Die", "The Notorious B.I.G.", "1994", "East Coast Hip-Hop, Gangsta Rap", "9.7", "97.9", "Big Poppa, Juicy, and lyrical perfection.", "Christopher Wallace's cinematic chronicle of street survival and fame."),
    ("In Rainbows", "Radiohead", "2007", "Art Rock, Alternative Rock", "9.7", "98.1", "Reckoner, Weird Fishes, and pay-what-you-want history.", "Warm, organic, and emotionally resonant."),
    ("Are You Experienced", "The Jimi Hendrix Experience", "1967", "Psychedelic Rock, Acid Rock, Blues Rock", "9.7", "97.5", "Purple Haze all in my brain.", "The electrifying debut that reinvented the electric guitar."),
    ("The Velvet Underground & Nico", "The Velvet Underground", "1967", "Proto-Punk, Art Rock", "9.7", "96.9", "Andy Warhol's peelable banana.", "Lou Reed's gritty depiction of New York counterculture."),
    ("Highway 61 Revisited", "Bob Dylan", "1965", "Folk Rock, Blues Rock", "9.8", "97.7", "How does it feel to be on your own, like a rolling stone?", "Dylan plugged in and transformed American songwriting forever."),
    ("Born to Run", "Bruce Springsteen", "1975", "Heartland Rock", "9.6", "97.0", "Tramps like us, baby we were born to run.", "An exhilarating, Wall of Sound cinematic rush through the American night."),
    ("Is This It", "The Strokes", "2001", "Garage Rock Revival, Post-Punk Revival", "9.5", "97.3", "Last Nite and NYC garage rock revitalized.", "Julian Casablancas and company brought effortless cool back to rock."),
    ("AM", "Arctic Monkeys", "2013", "Indie Rock, Garage Rock, R&B Groove", "9.5", "98.4", "Do I wanna know if this feeling flows both ways?", "Heavy hip-hop beats meeting rock riffs in nocturnal California."),
    ("The Low End Theory", "A Tribe Called Quest", "1991", "Jazz Rap, East Coast Hip-Hop", "9.7", "97.1", "Scenario and jazz basslines for the culture.", "Q-Tip, Phife Dawg, and Ron Carter's double bass craft golden-era hip-hop."),
    ("Madvillainy", "Madvillain", "2004", "Abstract Hip-Hop, Underground Rap", "9.7", "97.5", "MF DOOM and Madlib: the villainous duo.", "Micro-length songs, obscure jazz samples, and kaleidoscopic rhyme schemes."),
    ("Innervisions", "Stevie Wonder", "1973", "Soul, Funk, R&B", "9.7", "96.8", "Living for the City and Higher Ground.", "Wonder playing virtually every instrument on a landmark socially conscious record."),
    ("Enter the Wu-Tang (36 Chambers)", "Wu-Tang Clan", "1993", "Hardcore Hip-Hop, Boombap", "9.7", "97.8", "Cash Rules Everything Around Me (C.R.E.A.M.).", "RZA's dusty Kung-Fu film samples and nine Staten Island MCs."),
    ("Horses", "Patti Smith", "1975", "Proto-Punk, Art Rock", "9.6", "95.9", "Jesus died for somebody's sins but not mine.", "Poetry collided with raw rock energy on Robert Mapplethorpe's cover."),
    ("Untrue", "Burial", "2007", "Future Garage, Dubstep, Ambient", "9.7", "96.2", "Rain-slicked night buses and pitch-shifted ghost vocals.", "The definitive sonic portrait of solitary 2000s London nights."),
    ("Hounds of Love", "Kate Bush", "1985", "Art Pop, Synth-Pop, Progressive Pop", "9.7", "97.4", "Running Up That Hill (A Deal with God).", "Bush produced in her private studio, pairing synth-pop hits with The Ninth Wave suite."),
    ("Wish You Were Here", "Pink Floyd", "1975", "Progressive Rock, Art Rock", "9.7", "98.2", "Shine On You Crazy Diamond.", "A poignant tribute to Syd Barrett and a critique of the music business."),
    ("Currents", "Tame Impala", "2015", "Psychedelic Pop, Synth-Pop, Neo-Psychedelia", "9.6", "98.3", "Let It Happen, The Less I Know the Better.", "Kevin Parker's synthesizer-drenched break-up masterpiece."),
    ("Doolittle", "Pixies", "1989", "Alternative Rock, Indie Rock, Noise Pop", "9.6", "96.5", "Where Is My Mind?", "Loud-quiet-loud dynamics that directly paved the way for Nirvana."),
    ("All Eyez on Me", "2Pac", "1996", "West Coast Hip-Hop, Gangsta Rap", "9.6", "98.0", "California Love and Ambitionz Az a Ridah.", "The first double-disc hip-hop solo album, capturing Tupac at his most prolific."),
    ("The College Dropout", "Kanye West", "2004", "Chipmunk Soul, Hip-Hop", "9.6", "97.8", "Through the Wire with his jaw wired shut.", "West revolutionized 2000s hip-hop with soulful pitched-up samples."),
    ("Funeral", "Arcade Fire", "2004", "Indie Rock, Chamber Pop", "9.6", "96.6", "Wake Up and Neighborhood anthems of grief and catharsis.", "An emotionally overwhelming orchestral indie triumph."),
    ("Violator", "Depeche Mode", "1990", "Synth-Pop, Dark Wave", "9.6", "97.2", "Enjoy the Silence and Personal Jesus.", "Anton Corbijn visuals and Alan Wilder's pristine electronic production."),
    ("Grace", "Jeff Buckley", "1994", "Alternative Rock, Folk Rock, Soul", "9.7", "96.9", "The definitive cover of Leonard Cohen's Hallelujah.", "Buckley's astonishing vocal range and emotional vulnerability."),
    ("Trans-Europe Express", "Kraftwerk", "1977", "Electronic, Krautrock, Synth-Pop", "9.7", "96.5", "The electronic train that spawned hip-hop and techno.", "Sampled by Afrika Bambaataa and revered by David Bowie."),
    ("Siamese Dream", "The Smashing Pumpkins", "1993", "Alternative Rock, Shoegaze, Grunge", "9.6", "96.8", "Today and Cherub Rock wrapped in hundreds of guitar layers.", "Billy Corgan and Butch Vig's symphonic wall of distortion."),
    ("Music Has the Right to Children", "Boards of Canada", "1998", "IDM, Downtempo, Hauntology", "9.7", "96.3", "Nostalgic synth washes, warped cassette tape, and childhood memories.", "Scottish brothers Mike Sandison and Marcus Eoin create pastoral electronica."),
    ("In the Aeroplane Over the Sea", "Neutral Milk Hotel", "1998", "Indie Rock, Folk Rock, Lo-Fi", "9.6", "96.4", "Two-headed boy and singing saw hallucinations.", "Jeff Mangum's surrealist, acoustic acoustic explosion."),
    ("Loveless", "My Bloody Valentine", "1991", "Shoegaze, Dream Pop, Noise Rock", "9.7", "96.7", "Kevin Shields' glide guitar wall of sound.", "A shimmering, transcendent cloud of tremolo guitar and whispers."),
    ("Blood on the Tracks", "Bob Dylan", "1975", "Folk Rock, Acoustic", "9.7", "97.1", "Tangled Up in Blue and Simple Twist of Fate.", "Dylan's greatest, most searing exploration of relationship heartbreak."),
    ("good kid, m.A.A.d city", "Kendrick Lamar", "2012", "West Coast Hip-Hop, Narrative Rap", "9.7", "98.5", "A short film by Kendrick Lamar.", "Swimming Pools, Bitch Don't Kill My Vibe, and Compton street realism."),
    ("Aquemini", "Outkast", "1998", "Southern Hip-Hop, Psychedelic Soul", "9.7", "97.4", "Rosa Parks and SpottieOttieDopaliscious.", "Andre 3000 and Big Boi bridging opposing astrological signs into southern rap royalty."),
    ("My Beautiful Dark Twisted Fantasy", "Kanye West", "2010", "Art Pop, Baroque Hip-Hop", "9.7", "98.5", "Runaway, Power, and maximalist grandeur.", "Recorded in Hawaii with an all-star cast, defining modern album ambition."),
    ("The Black Parade", "My Chemical Romance", "2006", "Emo, Rock Opera, Pop Punk", "9.5", "97.8", "When I was a young boy, my father took me into the city.", "A flamboyant, theatrical rock opera following 'The Patient'."),
    ("Elephant", "The White Stripes", "2003", "Garage Rock Revival, Blues Rock", "9.5", "97.2", "Seven Nation Army stadium chant.", "Jack and Meg White recorded using only vintage eight-track analog tape equipment."),
    ("Automatic for the People", "R.E.M.", "1992", "Alternative Rock, Folk Rock", "9.6", "96.8", "Everybody Hurts and Man on the Moon.", "String arrangements by John Paul Jones and meditations on mortality."),
    ("Sgt. Pepper's Lonely Hearts Club Band", "The Beatles", "1967", "Psychedelic Rock, Art Rock", "9.8", "98.3", "A Day in the Life and the album as art form.", "The album that transformed rock into a serious art movement."),
    ("The Wall", "Pink Floyd", "1979", "Rock Opera, Art Rock", "9.6", "98.4", "Another Brick in the Wall (Part 2).", "Roger Waters' monumental narrative of isolation, wartime trauma, and totalitarian walls."),
    ("Exile on Main St.", "The Rolling Stones", "1972", "Roots Rock, Blues Rock, Country Rock", "9.7", "97.4", "Tumbling Dice recorded in a French basement.", "A sweaty, sprawling, decadent masterpiece of blues and rock n roll."),
    ("A Night at the Opera", "Queen", "1975", "Glam Rock, Progressive Rock, Hard Rock", "9.6", "98.3", "Bohemian Rhapsody and opera-scale multi-tracking.", "Freddie Mercury and Brian May pushed 24-track tape to its absolute limits."),
    ("Ten", "Pearl Jam", "1991", "Grunge, Hard Rock", "9.6", "97.7", "Alive, Jeremy, and Eddie Vedder's booming baritone.", "One of the pillar albums of 90s alternative rock."),
    ("The Chronic", "Dr. Dre", "1992", "G-Funk, West Coast Hip-Hop", "9.6", "97.9", "Nuthin' but a 'G' Thang with Snoop Doggy Dogg.", "Introduced the rolling G-funk synthesizers that ruled 90s hip-hop."),
    ("Like a Prayer", "Madonna", "1989", "Pop, Dance-Pop, Gospel", "9.5", "97.1", "Express Yourself and gospel-fueled pop mastery.", "Madonna's introspective, bold, and controversial peak."),
    ("Sign o' the Times", "Prince", "1987", "Funk, Rock, R&B, Soul", "9.8", "97.5", "A double album covering crack epidemics to spiritual redemption.", "Prince played nearly every instrument on his Fairlight CMI synthesizer."),
    ("Heaven or Las Vegas", "Cocteau Twins", "1990", "Dream Pop, Ethereal Wave", "9.6", "96.4", "Elizabeth Fraser's celestial glossolalia.", "The golden standard of dream pop, drenched in Robin Guthrie's shimmering chorus pedals."),
    ("Lateralus", "Tool", "2001", "Progressive Metal, Tool Sound", "9.6", "97.3", "Spiral out, keep going.", "Built around Fibonacci sequences and polyrhythmic drum wizardry."),
    ("Toxicity", "System of a Down", "2001", "Nu Metal, Alternative Metal, Armenian Folk", "9.5", "97.6", "Chop Suey! and erratic frantic tempo shifts.", "Rick Rubin production blending political rage and comedic theater."),
    ("Hybrid Theory", "Linkin Park", "2000", "Nu Metal, Rap Rock, Alternative Rock", "9.5", "98.3", "In the End and Chester Bennington's raw emotion.", "The best-selling debut album of the 21st century."),
    ("Demon Days", "Gorillaz", "2005", "Alternative Hip-Hop, Trip-Hop, Pop", "9.6", "98.0", "Feel Good Inc. produced by Danger Mouse.", "Damon Albarn's virtual cartoon band made a dark post-apocalyptic masterpiece."),
    ("Sound of Silver", "LCD Soundsystem", "2007", "Dance-Punk, Electronic Rock", "9.6", "96.9", "All My Friends and Someone Great.", "James Murphy's euphoric, melancholy ode to aging in the indie sleaze era."),
    ("Turn On the Bright Lights", "Interpol", "2002", "Post-Punk Revival, Indie Rock", "9.6", "96.6", "NYC nights, sharp suits, and echoing guitars.", "The cornerstone of early 2000s New York post-punk revival."),
    ("Norman Fucking Rockwell!", "Lana Del Rey", "2019", "Baroque Pop, Folk Rock, Dream Pop", "9.6", "97.8", "Jack Antonoff production chronicling the end of the American dream.", "Critically acclaimed as one of the best records of the 2010s."),
    ("Melodrama", "Lorde", "2017", "Electropop, Art Pop", "9.6", "97.7", "Green Light and the soundtrack of house party heartbreak.", "A brilliantly intimate portrait of teenage nightlife and heartbreak."),
    ("Folklore", "Taylor Swift", "2020", "Indie Folk, Chamber Pop", "9.5", "98.3", "Cardigan, Exile, and cottagecore songwriting.", "Recorded in quarantine with Aaron Dessner and Jack Antonoff."),
    ("Future Nostalgia", "Dua Lipa", "2020", "Nu-Disco, Dance-Pop", "9.5", "98.1", "Don't Start Now and Levitating.", "A sparkling, bassline-driven revival of 80s disco funk."),
    ("After Hours", "The Weeknd", "2020", "Synth-Pop, R&B, New Wave", "9.6", "98.9", "Blinding Lights broke all-time Billboard records.", "Red blazer, cinematic noir, and 80s synth revival."),
    ("IGOR", "Tyler, The Creator", "2019", "Neo-Soul, Hip-Hop, Funk", "9.6", "98.5", "Earfquake and a blonde wig persona.", "Won Best Rap Album, though it was largely a synth-funk singing record."),
    ("Renaissance", "Beyoncé", "2022", "House, Ballroom, Disco, Afrobeat", "9.6", "98.4", "Cuff It, Break My Soul, and a love letter to Black queer dance culture.", "Seamless transitions across 16 tracks celebrating dancefloor liberation."),
    ("SOS", "SZA", "2022", "R&B, Pop, Hip-Hop, Alternative Rock", "9.5", "98.2", "Kill Bill and Snooze.", "Spent ten weeks at No. 1 on the Billboard 200 with raw emotional lyricism."),
    ("Swimming", "Mac Miller", "2018", "Jazz Rap, Neo-Soul, Lo-Fi", "9.6", "97.9", "Self Care and introspective healing.", "Miller's heartfelt blend of acoustic piano, live bass, and reflective vocals."),
    ("2014 Forest Hills Drive", "J. Cole", "2014", "Hip-Hop, Conscious Rap", "9.5", "98.1", "No Love and Went Platinum with no features.", "Cole returning to his childhood home in Fayetteville, NC."),
    ("ASTROWORLD", "Travis Scott", "2018", "Psychedelic Trap, Hip-Hop", "9.5", "98.5", "SICKO MODE with Drake and multiple beat switches.", "An auditory amusement park ride dedicated to Houston, Texas."),
    ("The Marshall Mathers LP", "Eminem", "2000", "Hardcore Hip-Hop, Horrorcore", "9.6", "98.5", "Stan and The Real Slim Shady.", "Dr. Dre production and Eminem's razor-sharp storytelling and controversy."),
    ("Cross (†)", "Justice", "2007", "Electro House, French Touch", "9.5", "96.8", "D.A.N.C.E. and distorted slap bass.", "The Parisian duo took distorted synthesizers to rock-arena volumes."),
    ("The Fat of the Land", "The Prodigy", "1997", "Big Beat, Electronic Rock", "9.5", "97.1", "Firestarter and Breathe.", "Keith Flint and Liam Howlett fused rave culture with punk rock energy."),
    ("Dig Your Own Hole", "The Chemical Brothers", "1997", "Big Beat, Electronica", "9.5", "96.7", "Block Rockin' Beats.", "The British duo created festival-destroying breakbeat anthems."),
    ("You've Come a Long Way, Baby", "Fatboy Slim", "1998", "Big Beat, Breakbeat", "9.4", "96.8", "Praise You and The Rockafeller Skank.", "Norman Cook's joyful crate-digging sample masterpiece."),
    ("Ambient 1: Music for Airports", "Brian Eno", "1978", "Ambient", "9.6", "96.0", "As ignorable as it is interesting.", "The foundational document that coined the term 'Ambient Music'."),
    ("Selected Ambient Works Volume II", "Aphex Twin", "1994", "Dark Ambient, Minimalist Electronic", "9.6", "96.1", "Wordless, eerie, and endlessly fascinating sonic textures.", "24 unlabelled tracks of quiet isolation."),
    ("Dive", "Tycho", "2011", "Chillwave, Post-Rock, Ambient", "9.4", "96.2", "Warm analog sunset synths and crisp drum breaks.", "Scott Hansen's design aesthetic translated into shimmering sound."),
    ("Black Sands", "Bonobo", "2010", "Downtempo, Nu-Jazz, Trip-Hop", "9.5", "96.5", "Kong and Kiara.", "Simon Green's lush organic sampling and world instrumentation."),
    ("Rounds", "Four Tet", "2003", "Folktronica, IDM", "9.5", "96.2", "She Moves She and acoustic folk guitars sampled over clicks.", "Kieran Hebden's gentle, intricate electronic classic."),
    ("Time Out", "The Dave Brubeck Quartet", "1959", "Cool Jazz, West Coast Jazz", "9.7", "96.8", "Take Five in 5/4 time and Blue Rondo à la Turk in 9/8.", "Brubeck and Paul Desmond experimenting with unusual time signatures."),
    ("Giant Steps", "John Coltrane", "1960", "Hard Bop, Post-Bop", "9.7", "96.9", "The Coltrane matrix of chord substitutions.", "Coltrane's ferocious technical mastery before his spiritual period."),
    ("Bitches Brew", "Miles Davis", "1970", "Jazz Fusion, Avant-Garde Jazz", "9.7", "96.8", "Electric guitars, double drummers, and tape editing.", "Miles electrified jazz and birthed the jazz-fusion movement."),
    ("Mingus Ah Um", "Charles Mingus", "1959", "Post-Bop, Hard Bop", "9.6", "96.5", "Goodbye Pork Pie Hat and Better Git It in Your Soul.", "Mingus celebrating gospel roots and mourning Lester Young."),
    ("Waltz for Debby", "Bill Evans Trio", "1962", "Cool Jazz, Post-Bop", "9.6", "96.3", "Live at the Village Vanguard.", "Evans, Scott LaFaro on bass, and Paul Motian on drums."),
    ("Superfly", "Curtis Mayfield", "1972", "Funk, Blaxploitation Soundtrack, Soul", "9.7", "96.6", "Freddie's Dead and Pusherman.", "A soundtrack that famously surpassed the film in acclaim and impact."),
    ("Let's Stay Together", "Al Green", "1972", "Soul, Memphis Soul", "9.6", "96.7", "Willie Mitchell's Hi Records horn arrangements and Green's falsetto.", "The pinnacle of romantic Southern soul."),
    ("There's a Riot Goin' On", "Sly and the Family Stone", "1971", "Funk, Psychedelic Soul", "9.6", "96.5", "Family Affair using early drum machines.", "Dark, murky, and deeply influential funk masterpiece."),
    ("Mothership Connection", "Parliament", "1975", "P-Funk, Space Funk", "9.6", "96.8", "Give Up the Funk (Tear the Roof off the Sucker).", "George Clinton and Bootsy Collins landing the alien spaceship on funk."),
    ("Zombie", "Fela Kuti", "1976", "Afrobeat", "9.7", "96.4", "Tenacious saxophone and polyrhythmic defiance.", "Kuti criticizing the Nigerian military, making Afrobeat history.")
]

# Ensure we fill up to exactly 216 albums
while len(ALBUMS_DATA) < 216:
    idx = len(ALBUMS_DATA)
    extra_idx = (idx - 10) % len(EXTRA_ALBUMS)
    extra = EXTRA_ALBUMS[extra_idx]
    
    # Generate varied album entry
    variant = (idx // len(EXTRA_ALBUMS))
    title = extra[0] if variant == 0 else f"{extra[0]} (Vol. {variant + 1})"
    
    # Generate distinct colors for visual richness
    hue = (idx * 137.5) % 360  # Golden ratio color distribution
    r = int((math.sin(math.radians(hue)) * 0.5 + 0.5) * 200 + 30)
    g = int((math.sin(math.radians(hue + 120)) * 0.5 + 0.5) * 200 + 30)
    b = int((math.sin(math.radians(hue + 240)) * 0.5 + 0.5) * 200 + 30)
    
    bg_r = int(r * 0.15)
    bg_g = int(g * 0.15)
    bg_b = int(b * 0.15)
    
    ALBUMS_DATA.append({
        "id": idx,
        "title": title,
        "artist": extra[1],
        "release_year": extra[2],
        "genres": extra[3],
        "vote_average": extra[4],
        "vote_count": 25000 + (idx * 113) % 25000,
        "popularity": f"{95.0 + ((idx * 7) % 50) / 10.0:.1f}",
        "tagline": extra[6],
        "overview": extra[7],
        "tracks": [
            {"number": 1, "title": "Track One", "duration": "3:45"},
            {"number": 2, "title": "Track Two", "duration": "4:12"},
            {"number": 3, "title": "Track Three", "duration": "5:08"},
            {"number": 4, "title": "Track Four", "duration": "3:30"},
            {"number": 5, "title": "Track Five", "duration": "4:50"},
            {"number": 6, "title": "Track Six", "duration": "6:15"},
            {"number": 7, "title": "Track Seven", "duration": "4:01"},
            {"number": 8, "title": "Track Eight", "duration": "3:55"}
        ],
        "bg_color": (bg_r, bg_g, bg_b),
        "accent_color": (r, g, b)
    })

print(f"Generated {len(ALBUMS_DATA)} album metadata entries.")

# Format JSON entries matching nothing-to-watch structure + music extensions
formatted_json = []
for album in ALBUMS_DATA:
    formatted_json.append({
        "id": album["id"],
        "title": album["title"],
        "artist": album["artist"],
        "vote_average": str(album["vote_average"]),
        "vote_count": album["vote_count"],
        "backdrop_path": f"/media/single/{album['id']}.jpg",
        "imdb_id": f"music_{album['id']}",
        "overview": album["overview"],
        "popularity": str(album["popularity"]),
        "poster_path": f"/media/single/{album['id']}.jpg",
        "tagline": album["tagline"],
        "genres": album["genres"],
        "production_countries": "United States, United Kingdom, Worldwide",
        "keywords": f"music, vinyl, album, {album['artist'].lower()}, {album['title'].lower()}",
        "release_year": album["release_year"],
        "tracks": album["tracks"],
        "spotify_id": f"album_{album['id']}",
        "apple_music_id": f"album_{album['id']}",
        "youtube_id": f"album_{album['id']}"
    })

json_dir = "/Users/kaushal/Downloads/Nothing-to-listen-to/public/json"
os.makedirs(json_dir, exist_ok=True)
with open(os.path.join(json_dir, "0.json"), "w", encoding="utf-8") as f:
    json.dump(formatted_json, f, indent=2)

print("Saved public/json/0.json successfully.")

