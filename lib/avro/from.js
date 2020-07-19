"use strict"

import avro from "avsc"
import { actionContractFactory } from "./factories"

export const fromAVRO = ( content, AVRORule ) => {
  try {
    const Type = avro.Type.forSchema( [ actionContractFactory( `ResponseContract`, AVRORule ) ] )
    return Type.fromBuffer( content )
  } catch ( error ) {
    throw {
      name     : error?.name || `Transformer::fromAVRO:failed[type:${type}]`,
      message  : error?.message || "Something went wrong in unbuffering...",
      stack    : error?.stack || "",
      status   : error?.status || 500,
      userError: error?.userError || false
    }
  }
}