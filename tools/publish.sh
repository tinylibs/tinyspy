TYPE=$1

if [ -z "$TYPE" ]; then
    echo "Release type required!"
    exit 1
fi

npm version $TYPE
git push --follow-tags origin main
yarn build
npm run publish