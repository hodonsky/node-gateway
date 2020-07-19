"use strict"

import avro from "avsc"
import { isContentValidType } from "./typeCheck"
import { actionContractFactory } from "./factories"

export const toAVRO = async ( obj, AVRORule ) => {
  try {
    const Type = avro.Type.forSchema( [ actionContractFactory( `RequestContract`, AVRORule ) ] )
    try {
      if ( await isContentValidType( Type, obj )) {
        return Type.toBuffer( obj )
      }
    } catch ( error ){
      throw {
        message: error.message,
        name   : "Transformer::toAVRO:Types[isContentValidType]",
        stack  : error?.stack || "",
        status : 500
      }
    }
  } catch ( error ) {
    throw {
      name     : error?.name || `Transformer::toAVRO:failed[type:${type}]`,
      message  : error?.message || "Something went wrong in buffering...",
      stack    : error?.stack || "",
      status   : error?.status || 500,
      userError: error?.userError || false
    }
  }
}