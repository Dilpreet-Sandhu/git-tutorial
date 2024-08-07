import { ListItemText, Menu, MenuItem, MenuList, Tooltip } from '@mui/material'
import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setIsFileMenu, setuploadingLoader } from '../../redux/reducers/misc';
import { AudioFile, CloseRounded, Image, UploadFile, VideoFile } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useSendAttachmentMutation } from '../../redux/api/api';

const FileMenu = ({anchorEl,chatId}) => {

  const {isFileMenu} = useSelector(state => state.misc);
  const [sendAttachment] = useSendAttachmentMutation();
  const dispatch = useDispatch();
  const imageRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  
  const closeMenu = () => dispatch(setIsFileMenu(false));

  const handleClick = (ref) => {
    ref.current.click();
  }

  const fileChangeHandler = async (e,key) => {
    const files = Array.from(e.target.files);
    if (files.length < 0) {
      return 
    }
    dispatch(setuploadingLoader(true))
    const toastId = toast.loading(`sending ${key}`);

    closeMenu();

    try {

      const formData = new FormData();

      formData.append('chatId',chatId);
      files.forEach(file => {
        formData.append('photo',file)
      })



      const res = await sendAttachment(formData);

      if (res.data) toast.success(`${key} sent successfully`,{id : toastId})
    } catch (error) {
      toast.error(error)
    }finally {
      dispatch(setuploadingLoader(false))
    }

  }

  return (
    <Menu  open={isFileMenu} anchorEl={anchorEl} onClose={closeMenu}>
        <div style={{width:"10rem"}}>
        <MenuList>
          <MenuItem onClick={() => handleClick(imageRef)}>
            <Tooltip title={"Image"}>
              <Image/>
            </Tooltip>
            <ListItemText style={{paddingLeft:"0.5rem"}}>Image</ListItemText>
            <input type="file" accept='image/*' onChange={(e) => fileChangeHandler(e,"IMAGE") } style={{display:"none"}} ref={imageRef} />
          </MenuItem>
  
          <MenuItem onClick={() => handleClick(audioRef)}>
            <Tooltip title={"Audio"}>
              <AudioFile/>
            </Tooltip>
            <ListItemText style={{paddingLeft:"0.5rem"}}>Audio</ListItemText>
            <input type="file" accept='audio/*' onChange={(e) => fileChangeHandler(e,"AUDIO") } style={{display:"none"}} ref={audioRef}/>
          </MenuItem>
     
          <MenuItem onClick={() => handleClick(videoRef)}>
            <Tooltip title={"Video"}>
              <VideoFile/>
            </Tooltip>
            <ListItemText style={{paddingLeft:"0.5rem"}}>Video</ListItemText>
            <input type="file" accept='video/*' onChange={(e) => fileChangeHandler(e,"Video") } style={{display:"none"}} ref={videoRef}/>
          </MenuItem>
   
          <MenuItem onClick={() => handleClick(fileRef)}>
            <Tooltip title={"File"}>
              <UploadFile/>
            </Tooltip>
            <ListItemText style={{paddingLeft:"0.5rem"}}>File</ListItemText>
            <input type="file" accept='*' ref={fileRef}  onChange={(e) => fileChangeHandler(e,"file") } style={{display:"none"}}/>
          </MenuItem>
        </MenuList>
        </div>
    </Menu>
  )
}

export default FileMenu
