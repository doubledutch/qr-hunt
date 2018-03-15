import React from 'react'
import {View} from 'react-native'

export default ({color, size}) => (
  <View style={{height: size, width: size}}>
    <View style={{
      position: 'absolute',
      backgroundColor: color || '#fff',
      borderRadius: size*0.1,
      height: size * 0.5,
      width: size * 0.15,
      top: size * 0.42,
      left: size * 0.25,
      transform: [{rotate: '-45deg'}],
    }} />
    <View style={{
      position: 'absolute',
      backgroundColor: color || '#fff',
      borderRadius: size*0.1,
      height: size * 0.8,
      width: size * 0.15,
      top: size * 0.12,
      left: size * 0.6,
      transform: [{rotate: '40deg'}],
    }} />
  </View>
) 