import { Add, Remove } from '@mui/icons-material';
import { Avatar, IconButton, ListItem, Stack, Typography } from '@mui/material';
import React,{memo} from 'react';


const UserItem = ({user,handler,handlerIsLoading,isAdded,styling}) => {


    const {name,avatar,_id} = user;


  return (
    <ListItem>
        <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={"1rem"}
        width={"100%"}
        sx={styling}
        >
            <Avatar src={user.avatar}/>
            <Typography
                sx={{
                    flexGrow :"1",
                    display:"-webkit-flex",
                    WebkitLineClamp : "1",
                    WebkitBoxOrient: "vertical",
                    overflow:"hidden",
                    textOverflow:"ellipsis"
                }}
            >{name}</Typography>

            <IconButton onClick={() => handler(_id)} disabled={handlerIsLoading}>
                {
                    isAdded ? <Remove sx={{bgcolor:"red",borderRadius:"50%"}}  htmlColor='white'/> : <Add sx={{bgcolor:'green',borderRadius:"50%"}}  htmlColor='white'/>
                }
            </IconButton>
        </Stack>
    </ListItem>
  )
}

export default memo(UserItem)
