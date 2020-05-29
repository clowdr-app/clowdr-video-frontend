import React, { ChangeEvent, FormEvent, useState, useEffect, Component, Dispatch, SetStateAction } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import ToggleFullscreenButton from './ToggleFullScreenButton/ToggleFullScreenButton';
import Toolbar from '@material-ui/core/Toolbar';
import Menu from './Menu/Menu';

import { useAppState } from '../../state';
import { useParams } from 'react-router-dom';
import useRoomState from '../../hooks/useRoomState/useRoomState';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import { Typography } from '@material-ui/core';
import FlipCameraButton from './FlipCameraButton/FlipCameraButton';
import { DeviceSelector } from './DeviceSelector/DeviceSelector';
import { IVideoContext } from '../VideoProvider';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      backgroundColor: theme.palette.background.default,
    },
    toolbar: {
      [theme.breakpoints.down('xs')]: {
        padding: 0,
      },
    },
    rightButtonContainer: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    form: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      [theme.breakpoints.up('md')]: {
        marginLeft: '2.2em',
      },
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      maxWidth: 200,
    },
    loadingSpinner: {
      marginLeft: '1em',
    },
    displayName: {
      margin: '1.1em 0.6em',
      minWidth: '200px',
      fontWeight: 600,
    },
    joinButton: {
      margin: '1em',
    },
  })
);
class ConnectBridge extends Component<
  { videoContext: IVideoContext; setRoomName: Dispatch<SetStateAction<string>> },
  {}
> {
  componentWillUnmount(): void {
    if (this.props.videoContext.room && this.props.videoContext.room.disconnect) {
      // Detach the local media elements
      let room = this.props.videoContext.room;
      room.localParticipant.tracks.forEach(publication => {
        console.log(publication.track.kind);
        switch (publication.track.kind) {
          case 'video':
            publication.track.stop();
            const attachedElements1 = publication.track.detach();
            attachedElements1.forEach(element => element.remove());
            break;
          case 'audio':
            const attachedElements2 = publication.track.detach();
            attachedElements2.forEach(element => element.remove());
            break;
          default:
            console.log(publication.track.kind);
        }
        publication.unpublish();
        room.localParticipant.unpublishTrack(publication.track);
      });
      if (room.localParticipant.state === 'connected') {
        room.disconnect();
      }
      this.props.videoContext.localTracks.forEach(track => {
        track.stop();
      });
    }
  }

  render() {
    return <span></span>;
  }
}
export default function MenuBar() {
  const classes = useStyles();
  const { URLRoomName } = useParams();
  const { user, getToken, isFetching, meeting, token } = useAppState();
  const fullVideoContext = useVideoContext();
  const { isConnecting, connect } = fullVideoContext;
  const roomState = useRoomState();

  const [name, setName] = useState<string>(user?.displayName || '');
  const [roomName, setRoomName] = useState<string>('');

  useEffect(() => {
    if (URLRoomName) {
      setRoomName(URLRoomName);
    }
  }, [URLRoomName]);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleRoomNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRoomName(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // If this app is deployed as a twilio function, don't change the URL because routing isn't supported.
    if (!window.location.origin.includes('twil.io')) {
      window.history.replaceState(null, '', window.encodeURI(`/room/${roomName}${window.location.search || ''}`));
    }
    getToken(name, roomName).then(token => connect(token));
  };

  if (meeting && token)
    return (
      <AppBar className={classes.container} position="static">
        <ConnectBridge videoContext={fullVideoContext} setRoomName={setRoomName} />

        <Toolbar className={classes.toolbar}>
          {roomState === 'disconnected' ? <h3>Connecting...</h3> : <h3>Breakout Topic: {meeting}</h3>}
          <div className={classes.rightButtonContainer}>
            <FlipCameraButton />
            <DeviceSelector />
            <ToggleFullscreenButton />
            <Menu />
          </div>
        </Toolbar>
      </AppBar>
    );
  return (
    <AppBar className={classes.container} position="static">
      <Toolbar className={classes.toolbar}>
        {roomState === 'disconnected' ? (
          <form className={classes.form} onSubmit={handleSubmit}>
            {window.location.search.includes('customIdentity=true') || !user?.displayName ? (
              <TextField
                id="menu-name"
                label="Name"
                className={classes.textField}
                value={name}
                onChange={handleNameChange}
                margin="dense"
              />
            ) : (
              <Typography className={classes.displayName} variant="body1">
                {user.displayName}
              </Typography>
            )}
            <TextField
              id="menu-room"
              label="Room"
              className={classes.textField}
              value={roomName}
              onChange={handleRoomNameChange}
              margin="dense"
            />
            <Button
              className={classes.joinButton}
              type="submit"
              color="primary"
              variant="contained"
              disabled={isConnecting || !name || !roomName || isFetching}
            >
              Join Room
            </Button>
            {(isConnecting || isFetching) && <CircularProgress className={classes.loadingSpinner} />}
          </form>
        ) : (
          <h3>{roomName}</h3>
        )}
        <div className={classes.rightButtonContainer}>
          <FlipCameraButton />
          <DeviceSelector />
          <ToggleFullscreenButton />
          <Menu />
        </div>
      </Toolbar>
    </AppBar>
  );
}
