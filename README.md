# LazySoundSystem
A system for allowing multiple unauthenticated users nearby to control and queue music based on a voting system.

## What is working now:
 - Go to a DJ Webpage from the homepage
 - Get DJ Webpage with /dj/<Name>
 - Spotify API Search is exposed to the front end

## What there is to do:
 - Queue to manage songs that is based on user votes. DONE!
 - Restructure the database to remove the voting users from the queue.
 - Veto-ing system
 - Better UI
 - Apps to be able to share music with music apps
 - "Host" computer that actually plays the music

### Queue
 - Should have a downvote, upvote, and veto button.
 - A User only has limited veto's.
 - There should be some weight to the votes for when they are processed

## Ideas
 - Slimer.js for Grooveshark API
 - WebApp for Queue and Voting System
 - Backed by node
 - Using IO for no server
 - 3 Vetos for everyone.. maybe?

## Current Plans (Implemented and To-Be-Implemented)

### Backend (mostly Firebase)
Frontend -> Backend (our node.js server) -> Firebase -> Frontend

#### Structure for Firebase backend
(where does authentication (single session) come into play???)
 - Queue names (mapping to ids)
 - Queue ids (mapped to metadata)
   - name
   - id
   - (password)
 - Queue ids (mapped to actual list of songs)
