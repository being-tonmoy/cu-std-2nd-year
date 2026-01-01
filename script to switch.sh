#!/usr/bin/env bash

read -p "Enter Git user name: " GIT_NAME
read -p "Enter Git email: " GIT_EMAIL

read -p "Apply globally? (y/n): " APPLY_GLOBAL

if [[ "$APPLY_GLOBAL" == "y" ]]; then
    git config --global user.name "$GIT_NAME"
    git config --global user.email "$GIT_EMAIL"
    echo "Git user switched globally."
else
    git config user.name "$GIT_NAME"
    git config user.email "$GIT_EMAIL"
    echo "Git user switched for current repository."
fi

git config --get user.name
git config --get user.email
