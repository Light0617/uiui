#!/usr/bin/env bash

set -e

### USAGE NOTE ###
# In order to add a new argument, do the following step
# 1. Add new argument to argument template
#    * Argument always starts with double-dashed '--'
#    * If it is an argument with argument, add '=' behind it (for instance, '--path=')
#    * If it is a flagged argument, simply declared as 'dashed dashed argument' (--flag)
# 2. Locate 'Step 1' in the code below and map new argument to corresponding variable
#    * Says, we declare argument template '--path=', when we assign new variable 'path=argumentMap[path]'
# 3. Implements the method 'setCustomArgumentsDefaultBehavior' in the code below to define default value/behavior in case user does not provide the argument.
# 4. Implements the method 'preImageBuildSetup' if there is any additional setup before actual building of image.

### End of Usage Note ###



## Add additional argument templates here ##
argumentTemplates=("--branch=" "--push" "--brand=" "--skipNpm" "--skipBower" "--skipGrunt" "--dockerTag=")
imageBaseName="rdocker.mcp.com:6000/rainier-ui"

## if there is new argument template added, defined its default behavior here
setCustomArgumentsDefaultBehavior() {
  if [ -z $skipNpm ]
  then
    skipNpm=false
  fi

  if [ -z $brand ]
  then
    brand="default"
  fi

  if [ -z $skipBower ]
  then
    skipBower=false
  fi

  if [ -z $skipGrunt ]
  then
    skipGrunt=false
  fi
}


## setup prior to building images
preImageBuildSetup() {
  if ( ! $skipNpm)
  then
    /usr/bin/npm config set prefix /usr/bin/npm;
    export proxy=http://rproxy.mcp.com:3128;
    export https_proxy=http://rproxy.mcp.com:3128;
    /usr/bin/npm config set proxy http://rproxy.mcp.com:3128;
    /usr/bin/npm config set https-proxy http://rproxy.mcp.com:3128;
    git config --global http.proxy http://rproxy.mcp.com:3128;
    git config --global https.proxy http://rproxy.mcp.com:3128;
    /usr/bin/npm install || true;
  fi

  if (! $skipBower)
  then
    bower install --allow-root
  fi

  if (! $skipGrunt)
  then
    grunt switch-brand --brand $brand
    grunt build
  fi
}




################ DO NOT MODIFY THESE CODES ################
declare -A argumentMap

#Parse any given argument in format of '--argumentName=value', this methods extract both the name and value
#   and store it inside argumentMap variable
parseArgument () {
  for predefinedArg in "${argumentTemplates[@]}"
  do
    #construct pattern to be like '--branch=*'
    argumentRegex="${predefinedArg}*"
    case $1 in ${argumentRegex} )

      #given $1 to be '--branch=some-branch', this will remove '--branch=' and return 'some-branch' instead
      local value=$(expr "$1" : '.*=\(.*\)')

      #handle the case argument is a flag, once the argument name is registered with no value, consider it is a flag
      if [ -z $value ]
      then
        value=true
      fi

      #extract the argument name, for '--branch=', the extracted name will be 'branch'
      local argumentName=$(expr "$predefinedArg" : '--\([A-Za-z0-9]*\)')

      argumentMap[$argumentName]=$value
      ;;
    esac
  done
}


#iterate through the list of argument and parse them
for arg in "$@"
do
  parseArgument $arg
done


################ END OF -- DO NOT MODIFY THESE CODES -- ################


## Step 1: map all the user define arguments to variables ##
branch=${argumentMap[branch]}
push=${argumentMap[push]}
brand=${argumentMap[brand]}
skipNpm=${argumentMap[skipNpm]}
brand=${argumentMap[brand]}
skipBower=${argumentMap[skipBower]}
skipGrunt=${argumentMap[skipGrunt]}
dockerTag=${argumentMap[dockerTag]}

tags=()

## Step 2: validate arguments and discover if not defined ##
#determine wheter the built image needs to be published.
if [ -z $push ]
then
    push=false
fi

# figure out the branch if no branch name is defined
if [ -z $branch ]
then
  branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')
fi

#### Custom argument default value/behavior ###
setCustomArgumentsDefaultBehavior


#Step 3: additional setup
preImageBuildSetup


#Step 4: Define image tags.
# base tag
latestTag="${imageBaseName}:${branch}_${brand}_latest"
tags=($latestTag)

# build another tag based on docker tag if it is provided.
if [ ! -z $dockerTag ]
then
  tags=("${tags[@]}" "${imageBaseName}:$dockerTag")
fi


## Step 5: build image.
#build image for each tags
echo "=> Building ${tags[@]}"
tagString=""
for tag in "${tags[@]}"
do
  tagString+="-t ${tag} "
done
docker build ${tagString} .

if ($push)
then
  echo "=> Pushing ${tags[@]}"
  for tag in "${tags[@]}"
  do
    docker push "${tag}"
  done
  docker rmi "${tags[@]}"
fi
