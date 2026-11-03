for f in \
  src/pages/RuntimeSecurity.jsx \
  src/services/runtimeSecurityService.js \
  src/services/dockerService.js \
  src/components/common/Card.jsx \
  src/components/common/Badge.jsx
do
  if [ -f "$f" ]; then
    echo "========== $f =========="
    cat "$f"
    echo
  fi
done > /tmp/containershield-ui-part2.txt
