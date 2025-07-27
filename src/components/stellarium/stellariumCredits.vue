<template>
  <div>
    <!-- Modal Trigger -->
    <button
      @click="isModalOpen = true"
      class="p-2 bg-gray-700 border border-cyan-600 rounded-full shadow-md z-10"
    >
      <InformationCircleIcon class="w-7 h-7 text-white" />
    </button>

    <!-- Modal Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex"
      :class="containerClasses"
      @click.self="isModalOpen = false"
    >
      <div
        :class="modalClasses"
        class="bg-gray-800 text-white p-4 rounded-lg shadow-lg overflow-y-auto"
        @click.stop
      >
        <div
          class="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 pb-2 border-b border-gray-600"
        >
          <h2 class="text-xl font-bold">Data Credits</h2>
          <button @click="isModalOpen = false" class="text-white hover:text-gray-300 p-1">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="space-y-4">
          <section>
            <h3 class="font-semibold text-lg mb-2">Stars</h3>
            <p class="mb-2 text-sm">Combination of the following catalogues:</p>
            <ul class="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Gaia DR2:</strong> This work has made use of data from the European Space
                Agency (ESA) mission Gaia
                <a
                  href="https://www.cosmos.esa.int/gaia"
                  target="_blank"
                  class="text-cyan-400 hover:underline"
                >
                  (https://www.cosmos.esa.int/gaia) </a
                >, processed by the Gaia Data Processing and Analysis Consortium (DPAC,
                <a
                  href="https://www.cosmos.esa.int/web/gaia/dpac/consortium"
                  target="_blank"
                  class="text-cyan-400 hover:underline"
                >
                  https://www.cosmos.esa.int/web/gaia/dpac/consortium </a
                >). Funding for the DPAC has been provided by national institutions, in particular
                the institutions participating in the Gaia Multilateral Agreement.
              </li>
              <li>
                Gaia Collaboration et al. (2016): Description of the Gaia mission (spacecraft,
                instruments, survey and measurement principles, and operations)
              </li>
              <li>
                Gaia Collaboration et al. (2018b): Summary of the contents and survey properties.
              </li>
              <li>
                <strong>Hipparcos:</strong> The Hipparcos star catalog From ESA (European Space
                Agency) and the Hipparcos mission.
                <br />
                Ref. ESA, 1997, The Hipparcos and Tycho Catalogues, ESA SP-1200
                <a
                  href="http://cdsweb.u-strasbg.fr/ftp/cats/I/239"
                  target="_blank"
                  class="text-cyan-400 hover:underline"
                >
                  http://cdsweb.u-strasbg.fr/ftp/cats/I/239
                </a>
              </li>
              <li>
                <strong>Bright Stars Catalogue:</strong> Bright Star Catalogue, 5th Revised Ed.
                (Hoffleit+, 1991)
                <br />
                <a
                  href="http://cdsarc.u-strasbg.fr/ftp/pub/cats/V/50/"
                  target="_blank"
                  class="text-cyan-400 hover:underline"
                >
                  http://cdsarc.u-strasbg.fr/ftp/pub/cats/V/50/
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h3 class="font-semibold text-lg mb-2">Deep Sky Objects</h3>
            <p class="mb-2 text-sm">Combination of the following catalogues:</p>
            <ul class="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>HyperLeda database:</strong> Makarov et al. 2014, A&A, 570, A13
                <a
                  href="http://leda.univ-lyon1.fr"
                  target="_blank"
                  class="text-cyan-400 hover:underline"
                >
                  http://leda.univ-lyon1.fr
                </a>
              </li>
              <li>
                <strong>Simbad:</strong> Queries from Simbad, especially for the objects cross
                matching. This research has made use of the SIMBAD database, operated at CDS,
                Strasbourg, France
                <br />
                2000, A&AS, 143, 9, "The SIMBAD astronomical database", Wenger et al.
              </li>
              <li>
                <strong>Open NGC Database:</strong> Mattia Verga
                <a
                  href="https://github.com/mattiaverga/OpenNGC"
                  target="_blank"
                  class="text-cyan-400 hover:underline"
                >
                  https://github.com/mattiaverga/OpenNGC
                </a>
              </li>
              <li>Caldwell Catalogue: from wikipedia</li>
              <li>Descriptions and some data taken from wikipedia</li>
            </ul>
          </section>

          <section>
            <h3 class="font-semibold text-lg mb-2">Background Image</h3>
            <p class="mb-2 text-sm">Digitized Sky Survey:</p>
            <ul class="list-disc pl-5 space-y-1 text-sm">
              <li>
                STScI/NASA
                <a
                  href="http://archive.stsci.edu/dss/copyright.html"
                  target="_blank"
                  class="text-cyan-400 hover:underline"
                >
                  http://archive.stsci.edu/dss/copyright.html </a
                >, Colored & Healpixed by CDS
              </li>
              <li>
                This HiPS survey is based on 2 others HiPS surveys, respectively DSS2-red and
                DSS2-blue HiPS, both of them directly generated from original scanned plates
                downloaded from STScI site.
              </li>
              <li>
                The red component has been built from POSS-II F, AAO-SES,SR and SERC-ER plates.
              </li>
              <li>The blue component has been build from POSS-II J and SERC-J,EJ.</li>
              <li>The green component is based on the mean of other components.</li>
              <li>
                Three missing plates from red survey (253, 260, 359) has been replaced by pixels
                from the DSSColor STScI jpeg survey.
              </li>
              <li>
                The 11 missing blue plates (mainly in galactic plane) have not been replaced (only
                red component).
              </li>
            </ul>
            <p class="mt-2 text-sm">
              The Digitized Sky Surveys were produced at the Space Telescope Science Institute under
              U.S. Government grant NAG W-2166. The images of these surveys are based on
              photographic data obtained using the Oschin Schmidt Telescope on Palomar Mountain and
              the UK Schmidt Telescope.
            </p>
          </section>

          <section>
            <h3 class="font-semibold text-lg mb-2">Planets & Moons Textures</h3>
            <p class="text-sm mb-2">
              High-resolution planet textures from Stellarium Labs under Creative Commons Attribution 4.0 International (CC BY 4.0)
              <a
                href="https://data.stellarium.org/surveys/"
                target="_blank"
                class="text-cyan-400 hover:underline"
              >
                https://data.stellarium.org/surveys/
              </a>
            </p>
            <p class="text-sm">
              Original data from NASA & JPL under public domain license
              <a
                href="http://www.jpl.nasa.gov/images/policy/index.cfm"
                target="_blank"
                class="text-cyan-400 hover:underline"
              >
                http://www.jpl.nasa.gov/images/policy/index.cfm
              </a>
            </p>
            <p class="text-sm text-gray-400 mt-1">
              Texture processing by Oleg Pluton (Helleformer)
            </p>
          </section>

          <section>
            <h3 class="font-semibold text-lg mb-2">Minor Planets</h3>
            <p class="text-sm">
              All data comes from the IAU Minor Planet Center
              <a
                href="https://www.minorplanetcenter.net/data"
                target="_blank"
                class="text-cyan-400 hover:underline"
              >
                https://www.minorplanetcenter.net/data </a
              >. This research has made use of data and/or services provided by the International
              Astronomical Union's Minor Planet Center.
            </p>
          </section>

          <section>
            <h3 class="font-semibold text-lg mb-2">Others</h3>
            <ul class="list-disc pl-5 text-sm">
              <li>Landscape images by Fabien Chereau</li>
              <li>Constellation lines by Fabien Chereau</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { useOrientation } from '@/composables/useOrientation';

const isModalOpen = ref(false);

// Check if in landscape mode
const { isLandscape } = useOrientation();

// Container classes for modal positioning
const containerClasses = computed(() => ({
  'items-center justify-center p-4': !isLandscape.value,
  'items-center justify-end pr-4 pl-24': isLandscape.value, // Account for right navigation
}));

// Modal sizing classes
const modalClasses = computed(() => ({
  'max-w-4xl max-h-[80vh]': !isLandscape.value,
  'max-w-xl max-h-[80vh]': isLandscape.value,
}));
</script>

<style scoped>
/* Custom scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>
