# Mallard - A Discord Bot

## Setup

``npm i -S discord node-opus @google-cloud/speech ytdl-core fluent-ffmpeg``

## Functionality

While connected to a Discord guild, Mallard will constantly watch for users' game status updates. If the game is in its ``gameAlerts`` object, Mallard will check if there are enough players to form a full queue in that game (i.e. 2 for Hearthstone, 5 for League of Legends, etc).

The bot will then ask if it should ping the players in-game. It takes a response "yes" or "no" through either text or voice.

## Implementation details

The largest roadblock to getting the GCloud API to cooperate with the Discord API was the need to convert audio. I had originally been using Discord's ``createOpusStream`` to listen to voice, but instead I needed to use ``createPCMStream`` and convert it to ffmpeg like so:

``` javascript

if (speaking) {
    let stream = bot.receiver.createPCMStream(member.user);
    ffmpeg(stream)
        .inputFormat('s32le')
        .audioFrequency(16000)
        .audioChannels(1)
        .audioCodec('pcm_s16le')
        .format('s16le')
        .pipe(recognizeStream);

}

```

Once I did this, all I had to do was pipe the stream using Node to my GCloud output stream and voila!
