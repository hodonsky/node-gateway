"use strict"

import avro from "avsc"
import {
  actionContractFactory,
  responseContractFactory
} from "./factories"

export const fromAVRO = ( content, AVRORule, isResponse = false ) => {
  try {
    const Type = !isResponse
                  ? avro.Type.forSchema( [ actionContractFactory( "RequestContract", AVRORule ) ] )
                  : avro.Type.forSchema( [ responseContractFactory( "ResponseContract", AVRORule ) ] )
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