#!/usr/bin/env bash

if [ "$OS" == "Darwin" ]; then
    echo "MacOS"
elif [ "$OS" == "Linux" ]; then
    echo "Linux"
else
    echo "Other"
fi

# New value from first command line argument
NEW_VALUE="$1"
POD="$2"
CLEAN="$3"

pwd
# Modify app.json
JSON="example/app.json"


if [[ -f $JSON ]]; then
  sed -e "s/\"newArchEnabled\": true/\"newArchEnabled\": ${NEW_VALUE}/g" $JSON > temp.json && mv temp.json $JSON
  sed -e "s/\"newArchEnabled\": false/\"newArchEnabled\": ${NEW_VALUE}/g" $JSON > temp.json && mv temp.json $JSON
else
  echo "${JSON} Not found"
fi


# Validate new value is either "true" or "false"
if [ "${NEW_VALUE}" != "true" ] && [ "${NEW_VALUE}" != "false" ]; then
  echo "Error: The argument should be either 'true' or 'false'"
  exit 1
fi

if [ ! -d "example/android" ]; then
    ANDROID_GEN=1
    yarn gen:android
fi
if [ ! -d "example/ios" ]; then
    IOS_GEN=1
    yarn gen:ios
fi


# Gradle properties file
GRADLE_RPOPERTIES="example/android/gradle.properties"

PROPERTY="newArchEnabled"
if [ -f $GRADLE_RPOPERTIES ]; then
sed -e "s/${PROPERTY}=.*/${PROPERTY}=${NEW_VALUE}/" ${GRADLE_RPOPERTIES} > temp && mv temp ${GRADLE_RPOPERTIES}
else
echo "${GRADLE_RPOPERTIES} Not found"
fi


if [[ $CLEAN == 'true' ]]; then
yarn gen:android:clean
yarn gen:ios:clean
else

if [[ $ANDROID_GEN != '1' ]]; then
yarn gen:android
fi
if [[ $IOS != '1' ]]; then
yarn gen:ios
fi

if [[ $POD == 'true' ]]; then
if [[ $NEW_VALUE == 'true' ]]; then
  yarn pod:new
else
  yarn pod:old
fi
fi
fi



